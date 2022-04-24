import numpy as np
import pandas as pd
import requests
import re
import os
from tqdm import tqdm
import matplotlib.pyplot as plt
from pandarallel import pandarallel
import csv
import json
from geojson import Feature, FeatureCollection, Point
import math

x_pi = 3.14159265358979324 * 3000.0 / 180.0
pi = 3.1415926535897932384626
a = 6378245.0
ee = 0.00669342162296594323


def out_of_china(lng, lat):
    return not (lng > 73.66 and lng < 135.05 and lat > 3.86 and lat < 53.55)


def _lat(lng, lat):
    ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + \
        0.1 * lng * lat + 0.2 * math.sqrt(math.fabs(lng))
    ret += (20.0 * math.sin(6.0 * lng * pi) + 20.0 *
            math.sin(2.0 * lng * pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(lat * pi) + 40.0 *
            math.sin(lat / 3.0 * pi)) * 2.0 / 3.0
    ret += (160.0 * math.sin(lat / 12.0 * pi) + 320 *
            math.sin(lat * pi / 30.0)) * 2.0 / 3.0
    return ret


def _lng(lng, lat):
    ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + \
        0.1 * lng * lat + 0.1 * math.sqrt(math.fabs(lng))
    ret += (20.0 * math.sin(6.0 * lng * pi) + 20.0 *
            math.sin(2.0 * lng * pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(lng * pi) + 40.0 *
            math.sin(lng / 3.0 * pi)) * 2.0 / 3.0
    ret += (150.0 * math.sin(lng / 12.0 * pi) + 300.0 *
            math.sin(lng / 30.0 * pi)) * 2.0 / 3.0
    return ret


def bd09_to_gcj02(bd_lon, bd_lat):
    x = bd_lon - 0.0065
    y = bd_lat - 0.006
    z = math.sqrt(x * x + y * y) - 0.00002 * math.sin(y * x_pi)
    theta = math.atan2(y, x) - 0.000003 * math.cos(x * x_pi)
    gg_lng = z * math.cos(theta)
    gg_lat = z * math.sin(theta)
    return [gg_lng, gg_lat]


def gcj02_to_wgs84(lng, lat):
    if out_of_china(lng, lat):
        return [lng, lat]
    dlat = _lat(lng - 105.0, lat - 35.0)
    dlng = _lng(lng - 105.0, lat - 35.0)
    radlat = lat / 180.0 * pi
    magic = math.sin(radlat)
    magic = 1 - ee * magic * magic
    sqrtmagic = math.sqrt(magic)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * pi)
    dlng = (dlng * 180.0) / (a / sqrtmagic * math.cos(radlat) * pi)
    mglat = lat + dlat
    mglng = lng + dlng
    return [lng * 2 - mglng, lat * 2 - mglat]


def bd09_to_wgs84(bd_lon, bd_lat):
    try:
        lon, lat = bd09_to_gcj02(float(bd_lon), float(bd_lat))
        return gcj02_to_wgs84(lon, lat)
    except:
        return -1, -1


def GD_GPS(address: str, mykey='72ead2a93fc3bbf89d9f92e144266eb0', ):
    dist2acode = {'黄浦区':	310101,
                  '徐汇区':	310104,
                  '长宁区':	310105,
                  '静安区':	310106,
                  '普陀区':	310107,
                  '虹口区':	310109,
                  '杨浦区':	310110,
                  '闵行区':	310112,
                  '宝山区':	310113,
                  '嘉定区':	310114,
                  '浦东新区':	310115,
                  '金山区': 310116,
                  '松江区': 310117,
                  '青浦区':	310118,
                  '奉贤区':	310120,
                  '崇明区':	310151}
    try:
        _, city, _ = re.split(r'(^.+区)', address[:4])
        url = f'https://restapi.amap.com/v3/geocode/geo?address=上海市{city+address}&key={mykey}&city={dist2acode[city]}'

        res = requests.get(url).content.decode()
        return tuple(json.loads(res).get('geocodes')[0].get('location').split(','))
    except:
        print(address)
        return -1, -1


def GD_townInfo(lng, lat, mykey='72ead2a93fc3bbf89d9f92e144266eb0'):
    url = f'https://restapi.amap.com/v3/geocode/regeo?&location={lng},{lat}&key={mykey}&radius=200&extensions=all&poitype=120100|120300|120301|120302|120303|120304|130100|130102|130103|130104|130105|130106|130107|141200|141201|141202|141203|141204|141205|141206|141207|170000|170100|170200|170202|170203|170205|170206|170207|170300|190000|190100|190101|190102|190103|190104|190105|190106|190107|190108|190109|190400|190401|190402|190403'
    res = requests.get(url).content.decode()
    m = json.loads(res)

    regeocode = m.get('regeocode')
    addressComponent = regeocode.get('addressComponent')

    name, province, district, township = '-1', '-1', '-1', '-1'

    province = addressComponent.get('province')
    district = addressComponent.get('district')
    township = addressComponent.get('township')

    if township == []:
        township = '-1'

    try:
        name = regeocode.get('pois')[0].get('name')
    except:
        name = regeocode.get('formatted_address')
        # print(lng, lat)
    return name, province, district, township


def getGPS(address: str, myAK='27gAPLcAkOCzK6NGQVyRyMQYPGjRBa9F'):
    # myAK = '27gAPLcAkOCzK6NGQVyRyMQYPGjRBa9F'
    url = 'https://api.map.baidu.com/geocoding/v3/?address=' + \
        address + '&output=json&coordtype=bd09ll&ak=' + myAK
    res = requests.get(url)
    res.data = res.content.decode()
    # print(res.data)
    pattern = '\"lng\"\:(\d+\.\d+),\"lat\"\:(\d+\.\d+)'
    try:
        return re.findall(pattern, res.data)[0]
    except:
        print(res.data)


def getTownInfo(lng, lat, myAK='27gAPLcAkOCzK6NGQVyRyMQYPGjRBa9F'):

    try:
        # 导入百度地图API,AK
        # url = f'https://api.map.baidu.com/reverse_geocoding/v3/?ak={myAK}&output=json&coordtype=bd09ll&location={lat},{lng}&extensions_town=true&extensions_poi=1'
        url = f'https://api.map.baidu.com/reverse_geocoding/v3/?ak={myAK}&output=json&coordtype=bd09ll&location={lat},{lng}&extensions_town=true&extensions_poi=1&poi_types=房地产|行政地标|公司企业|教育培训|医疗|政府机构'

        res = requests.get(url).content.decode()
        m = json.loads(res)
        # print(m)

        jsonResult = m.get('result')
        address = jsonResult.get('addressComponent')

        city, district, town = '-1', '-1', '-1'

        # 省
        # province = address.get('province')
        # 城市
        city = address.get('city')
        # 县区
        district = address.get('district')
        # 街道
        town = address.get('town')
        # 街道编号
        # town_n = address.get('town_code')
        name = jsonResult.get('pois')[0].get('name')

        # poiType
        poiType = jsonResult.get('pois')[0].get('poiType')

    except:
        # print(jsonResult)
        name = '-1'
        poiType =  '-1'

    # print(f"小区：{name}，市：{city}，区：{district}，街道：{town}，街道编码：{town_n}")
    return name, poiType, city, district, town


def Encoder(x: pd.Series, district_encode):
    try:
        return '021' + district_encode[x.district][0]+district_encode[x.district][1][x.town][0]+district_encode[x.district][1][x.town][1]['(' + str(x.lon_wgs) + ', '+str(x.lat_wgs) + ')']
    except:
        return '-1'


# import pandas as pd
# import json
# import math
# import os
# import csv

# x_pi = 3.14159265358979324 * 3000.0 / 180.0
# pi = 3.1415926535897932384626  # π
# a = 6378245.0  # 长半轴
# ee = 0.00669342162296594323  # 扁率

# def gcj02towgs84(lng, lat):
#     """
#     GCJ02(火星坐标系)转GPS84
#     :param lng:火星坐标系的经度
#     :param lat:火星坐标系纬度
#     :return:
#     """
#     if out_of_china(lng, lat):
#         return lng, lat
#     dlat = transformlat(lng - 105.0, lat - 35.0)
#     dlng = transformlng(lng - 105.0, lat - 35.0)
#     radlat = lat / 180.0 * pi
#     magic = math.sin(radlat)
#     magic = 1 - ee * magic * magic
#     sqrtmagic = math.sqrt(magic)
#     dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * pi)
#     dlng = (dlng * 180.0) / (a / sqrtmagic * math.cos(radlat) * pi)
#     mglat = lat + dlat
#     mglng = lng + dlng
#     return [lng * 2 - mglng, lat * 2 - mglat]

# def transformlat(lng, lat):
#     ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + \
#         0.1 * lng * lat + 0.2 * math.sqrt(math.fabs(lng))
#     ret += (20.0 * math.sin(6.0 * lng * pi) + 20.0 *
#             math.sin(2.0 * lng * pi)) * 2.0 / 3.0
#     ret += (20.0 * math.sin(lat * pi) + 40.0 *
#             math.sin(lat / 3.0 * pi)) * 2.0 / 3.0
#     ret += (160.0 * math.sin(lat / 12.0 * pi) + 320 *
#             math.sin(lat * pi / 30.0)) * 2.0 / 3.0
#     return ret

# def transformlng(lng, lat):
#     ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + \
#         0.1 * lng * lat + 0.1 * math.sqrt(math.fabs(lng))
#     ret += (20.0 * math.sin(6.0 * lng * pi) + 20.0 *
#             math.sin(2.0 * lng * pi)) * 2.0 / 3.0
#     ret += (20.0 * math.sin(lng * pi) + 40.0 *
#             math.sin(lng / 3.0 * pi)) * 2.0 / 3.0
#     ret += (150.0 * math.sin(lng / 12.0 * pi) + 300.0 *
#             math.sin(lng / 30.0 * pi)) * 2.0 / 3.0
#     return ret

# def out_of_china(lng, lat):
#     """
#     判断是否在国内，不在国内不做偏移
#     :param lng:
#     :param lat:
#     :return:
#     """
#     if lng < 72.004 or lng > 137.8347:
#         return True
#     if lat < 0.8293 or lat > 55.8271:
#         return True
#     return False
