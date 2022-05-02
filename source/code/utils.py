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
import time

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
    """
    bd09转GPS84
    :param bd_lon:百度坐标系的经度
    :param bd_lat:百度坐标系纬度
    :return:
    """
    x = bd_lon - 0.0065
    y = bd_lat - 0.006
    z = math.sqrt(x * x + y * y) - 0.00002 * math.sin(y * x_pi)
    theta = math.atan2(y, x) - 0.000003 * math.cos(x * x_pi)
    gg_lng = z * math.cos(theta)
    gg_lat = z * math.sin(theta)
    return [gg_lng, gg_lat]


def gcj02_to_wgs84(lng, lat):
    """
    GCJ02(火星坐标系)转GPS84
    :param lng:火星坐标系的经度
    :param lat:火星坐标系纬度
    :return:
    """
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


def GD_GPS(address: str, verbose=False, mykey='72ead2a93fc3bbf89d9f92e144266eb0'):
    d = re.split(r'(^.+区)', address[:4])[1]
    url = f'https://restapi.amap.com/v3/geocode/geo?address={address}&key={mykey}&city={d}'
    res = json.loads(requests.get(url).content.decode())
    if verbose:
        print(res)
    lng, lat = tuple(res.get('geocodes')[0].get('location').split(','))

    # 如果geocodes.level == 区县，认为没有获得准确坐标
    if res.get('geocodes')[0].get('level') == '区县':
        return lng, lat, False

    return lng, lat, True


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


def BD_GPS(address: str, myAK='27gAPLcAkOCzK6NGQVyRyMQYPGjRBa9F'):
    url = 'https://api.map.baidu.com/geocoding/v3/?address=' + \
        address + '&output=json&coordtype=bd09ll&ak=' + myAK
    res = json.loads(requests.get(url).content.decode())
    result = res.get('result')
    location = result.get('location')

    return location.get('lng'), location.get('lat'), result.get('precise')


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
        poiType = '-1'

    # print(f"小区：{name}，市：{city}，区：{district}，街道：{town}，街道编码：{town_n}")
    return name, poiType, city, district, town


def Encoder(x: pd.Series, district_encode):
    try:
        return '021' + district_encode[x.district][0]+district_encode[x.district][1][x.town][0]+district_encode[x.district][1][x.town][1]['(' + str(x.lon_wgs) + ', '+str(x.lat_wgs) + ')']
    except:
        return '-1'


def gcj02towgs84(lng, lat):

    if out_of_china(lng, lat):
        return lng, lat
    dlat = transformlat(lng - 105.0, lat - 35.0)
    dlng = transformlng(lng - 105.0, lat - 35.0)
    radlat = lat / 180.0 * pi
    magic = math.sin(radlat)
    magic = 1 - ee * magic * magic
    sqrtmagic = math.sqrt(magic)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * pi)
    dlng = (dlng * 180.0) / (a / sqrtmagic * math.cos(radlat) * pi)
    mglat = lat + dlat
    mglng = lng + dlng
    return [lng * 2 - mglng, lat * 2 - mglat]


def transformlat(lng, lat):
    ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + \
        0.1 * lng * lat + 0.2 * math.sqrt(math.fabs(lng))
    ret += (20.0 * math.sin(6.0 * lng * pi) + 20.0 *
            math.sin(2.0 * lng * pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(lat * pi) + 40.0 *
            math.sin(lat / 3.0 * pi)) * 2.0 / 3.0
    ret += (160.0 * math.sin(lat / 12.0 * pi) + 320 *
            math.sin(lat * pi / 30.0)) * 2.0 / 3.0
    return ret


def transformlng(lng, lat):
    ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + \
        0.1 * lng * lat + 0.1 * math.sqrt(math.fabs(lng))
    ret += (20.0 * math.sin(6.0 * lng * pi) + 20.0 *
            math.sin(2.0 * lng * pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(lng * pi) + 40.0 *
            math.sin(lng / 3.0 * pi)) * 2.0 / 3.0
    ret += (150.0 * math.sin(lng / 12.0 * pi) + 300.0 *
            math.sin(lng / 30.0 * pi)) * 2.0 / 3.0
    return ret


poiType_convert = {
    '摩托车服务': '公司企业',
    '公司企业': '公司企业',
    '酒店': '公司企业',
    '交通设施': '其他',
    '购物': '公司企业',
    '运动健身': '公司企业',
    '住宿服务': '公司企业',
    '汽车服务': '公司企业',
    '教育培训': '教育培训',
    '交通设施服务': '其他',
    '政府机构及社会团体': '政府机构',
    '房地产': '居民区',
    '通行设施': '公司企业',
    '行政地标': '行政地标',
    '医疗': '医疗',
    '文化传媒': '其他',
    '美食': '公司企业',
    '体育休闲服务': '其他',
    '汽车维修': '公司企业',
    '科教文化服务': '其他',
    '政府机构': '政府机构',
    '出入口': '居民区',
    '旅游景点': '其他',
    '住宅区': '居民区',
    '产业园区': '公司企业',
    '购物服务': '公司企业',
    '汽车销售': '公司企业',
    '地名地址信息': '居民区',
    '生活服务': '公司企业',
    '其他': '其他',
    '商务住宅相关': '其他',
    '休闲娱乐': '其他',
    '风景名胜': '其他',
    '公交设施': '其他',
    '内部楼号': '其他',
    '餐饮服务': '公司企业',
    '医疗保健服务': '医疗',
    "楼宇": '其他'
}


def GD_GPS_TownInfo(address: str, verbose=False, mykey='72ead2a93fc3bbf89d9f92e144266eb0'):
    t = time.perf_counter()
    '''dist2acode = {'黄浦区':	310101,
                  '徐汇区':	310104,
                  '长宁区':	310105,
                  '静安区':	310106,
                  '普陀区':	310107,
                  '虹口区':	310109,
                  '杨浦区':	310110,
                  '闵行区':	310112,
                  '宝山区':	310113,
                  '嘉定区':	310114,
                  '浦东新区':  310115,
                  '金山区':    310116,
                  '松江区':    310117,
                  '青浦区':	310118,
                  '奉贤区':	310120,
                  '崇明区':	310151,
                  '东城区':	110101,
                  '西城区':	110102,
                  '朝阳区':	110105,
                  '丰台区':	110106,
                  '石景山区':	110107,
                  '海淀区': 110108,
                  '门头沟区': 110109,
                  '房山区':	110111,
                  '通州区':	110112,
                  '顺义区':	110113,
                  '昌平区':	110114,
                  '大兴区':	110115,
                  '怀柔区':	110116,
                  '平谷区':	110117,
                  '密云区':	110118,
                  '延庆区':	110119

                  }'''
    d = re.split(r'(^.+区)', address[:4])[1]
    address_simp = address[len(d):]
    # print(address_simp)
    # try:
    # 获取经纬度坐标（gcj坐标）
    url = f'https://restapi.amap.com/v3/geocode/geo?address={address}&key={mykey}&city={d}'

    res = json.loads(requests.get(url).content.decode())
    # print(res)

    # 如果geocodes.level == 区县，认为没有获得准确坐标
    # if res.get('geocodes')[0].get('level') == '区县':
    # 尝试百度API，若也没有获得置信度高的坐标，则返回***区某地

    lng, lat = tuple(res.get('geocodes')[0].get('location').split(','))
    # return lng, lat
    # 获取坐标对应的POI信息
    url = f'https://restapi.amap.com/v3/geocode/regeo?&location={lng},{lat}&key={mykey}&extensions=all&radius=3000&homeorcorp=1'
    res = requests.get(url).content.decode()
    m = json.loads(res)
    if verbose:
        print(f'GD: {m}\n\n')

    regeocode = m.get('regeocode')
    addressComponent = regeocode.get('addressComponent')
    province = addressComponent.get('province')
    district = addressComponent.get('district')
    # if district != d:
    #     print(f"{address}: district get from BD API is: {district}")
    township = addressComponent.get('township')
    if township == []:
        township = '-1'
    lng, lat = gcj02towgs84(float(lng), float(lat))

    confience = 0
    for poi in regeocode.get('pois'):
        name = poi.get('name')
        if name == [] or poi.get('address') == []:
            continue
        if re.match('.*'+address_simp, name) or re.match('.*'+address_simp, poi.get('address')):
            poiType = poi.get('type').split(';')[0]
            if poiType == '商务住宅':
                # print(poi.get('type'))
                poiType = poi.get('type').split(';')[1]
            if poiType == '金融保险服务' or poiType == '金融':
                continue
            try:
                poiType = poiType_convert[poiType]
            except:
                print(f'get {poiType}, fail to convert')
            # 'location': '121.484410,31.202430'
            lng, lat = poi.get('location').split(',')
            lng, lat = gcj02towgs84(float(lng), float(lat))
            confience = 1
            if time.perf_counter() - t > 2.0:
                print(address)
            return province, district, township, name, poiType, lng, lat, '高德', confience
    # print("cannot find POI with confidence of 1 via GD")
    province_, district_, township_, name_, poiType_, lng_, lat_, source_, confience = BD_GPS_TownInfo(
        address, verbose)

    if confience == 1:
        if time.perf_counter() - t > 2.0:
            print(address)
        return province_, district_, township_, name_, poiType_, lng_, lat_, source_, confience

    if time.perf_counter() - t > 2.0:
        print(address)
    return province, district, township, regeocode.get('formatted_address')+"附近", '其他', lng, lat, '高德', 0.5


def BD_GPS_TownInfo(address: str, verbose=False, myAK='27gAPLcAkOCzK6NGQVyRyMQYPGjRBa9F'):
    d = re.split(r'(^.+区)', address[:4])[1]
    address_simp = address[len(d):]
    confidence = 0

    url = 'https://api.map.baidu.com/geocoding/v3/?address=' + \
        address + '&output=json&coordtype=bd09ll&ak=' + myAK
    res = requests.get(url)
    res.data = res.content.decode()
    # print(res.data)
    pattern = '\"lng\"\:(\d+\.\d+),\"lat\"\:(\d+\.\d+)'
    lng, lat = re.findall(pattern, res.data)[0]

    url = f'https://api.map.baidu.com/reverse_geocoding/v3/?ak={myAK}&radius=3000&output=json&coordtype=bd09ll&location={lat},{lng}&extensions_town=true&extensions_poi=1'

    res = requests.get(url).content.decode()
    m = json.loads(res)
    if verbose:
        print(f'BD: {m}\n\n')

    jsonResult = m.get('result')
    addressComponent = jsonResult.get('addressComponent')
    province = addressComponent.get('province')
    district = addressComponent.get('district')
    town = addressComponent.get('town')
    formatted_address = jsonResult.get('formatted_address')
    lng, lat = bd09_to_wgs84(lng, lat)

    # 在返回的POIs中搜索
    for poi in jsonResult.get('pois'):
        name = poi.get('name')
        if re.match('.*'+address_simp, name) or re.match('.*'+address_simp, poi.get('addr')):
            # print(poi)
            # 'point': {'x': 121.44328729847489, 'y': 31.032007490040044}
            point = poi.get('point')
            lng, lat = point['x'], point['y']
            lng, lat = bd09_to_wgs84(lng, lat)
            poiType = poi.get('poiType')
            if poiType == '金融保险服务' or poiType == '金融':
                continue
            confidence = 1
            try:
                poiType = poiType_convert[poiType]
            except:
                print(f'get {poiType}, fail to convert')
            return province, district, town, name, poiType, lng, lat, '百度', confidence

    return province, district, town, formatted_address+"附近", '其他', lng, lat, '百度', 0.5
