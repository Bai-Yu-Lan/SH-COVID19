import datetime
import re
import pandas as pd
import requests
from bs4 import BeautifulSoup

def get_location(loc_url):
    # location
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36 Edg/97.0.1072.69",
        "Referer": "https://mp.weixin.qq.com"}

    try:
        res = requests.get(url=loc_url, headers=headers)
        if res.status_code == 200:
            res.encoding = res.apparent_encoding
            res = BeautifulSoup(res.text, "lxml")
    except requests.ConnectionError as e:
        print('catch wrong', e.args)

    # 根据标题提取日期
    title = res.select_one('#activity-name').text
    date_extract = '2022年' + re.findall(r"[0-9]{1,2}月[0-9]{1,2}日", title)[0]
    dateformat = datetime.datetime.strptime(date_extract, '%Y年%m月%d日').strftime('%Y-%m-%d')
    dateformat2 = datetime.datetime.strptime(date_extract, '%Y年%m月%d日').strftime('%m%d')
    yesterday_format = (datetime.date.today() - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
    loc_list = []
    whole_page = res.select('#js_content > section')
    # js_content > section:nth-child(2) > section > section > section > section:nth-child(2) > section:nth-child(4) > section > section > section > p:nth-child(1)
    loc_df = pd.DataFrame(columns=['district', 'address', 'confirm_date'])
    r = 0
    for i, block in enumerate(whole_page):
        # 浦东新区第一个块的格式有点特别，和其他的不太一样
        if i == 0:
            loc_list.append('浦东新区')
            block = block.select_one(
                'section > section > section > section:nth-child(2) > section:nth-child(4) > section > section > section')
            for i, item in enumerate(block):
                item = item.text
                if item == '' or '新增' in item or '消毒' in item:
                    pass
                else:
                    address = item.replace('，', '').replace('。', '').replace('、', '').replace(',',
                                                                                              '').replace(' ',
                                                                                                          '').replace(
                        ' ', '')
                    loc_df.loc[r] = ['浦东新区', address, dateformat]
                    r += 1
                    loc_list.append(address)
        # 其他块都可以用这种方式提取
        else:
            try:
                if block.text != '' and block is not None:
                    block = block.select('section > section > p')
                    for i, item in enumerate(block):
                        item = item.text
                        if item == '' or '消毒' in item or '（滑动查看更多↓）' in item:
                            pass
                        elif len(re.findall(r"浦东新区|黄浦区|静安区|徐汇区|长宁区|普陀区|虹口区|杨浦区|宝山区|闵行区|嘉定区|金山区|松江区|青浦区|奉贤区|崇明区",
                                            item)) > 0:
                            district = \
                            re.findall(r"浦东新区|黄浦区|静安区|徐汇区|长宁区|普陀区|虹口区|杨浦区|宝山区|闵行区|嘉定区|金山区|松江区|青浦区|奉贤区|崇明区", item)[0]
                            loc_list.append(district)
                        else:
                            address = item.replace('，', '').replace('。', '').replace('、',
                                                                                     '').replace(
                                ',', '').replace(' ', '').replace(' ', '')
                            loc_df.loc[r] = [district, address, dateformat]
                            r += 1
                            loc_list.append(address)
            except Exception as e:
                print('error!', e)
                print(i, block)
    # 两种存储格式，csv和txt(参考项目存储格式)
    # # csv,不要可以注释掉
    # loc_df.to_csv('../data/居住地信息/{}.csv'.format(dateformat), encoding='utf_8_sig',index=False)
    # txt格式
    with open("../data/居住地信息/{}.txt".format(dateformat2), "w", encoding='utf-8') as file:
        for item in loc_list:
            file.write(item+'\n')
        file.close()

if __name__ == '__main__':
    # 每天手动改一下文章链接！
    loc_url = 'https://mp.weixin.qq.com/s/Dt_Q7mwgzJIdn7NwqeGNeA'
    get_location(loc_url)