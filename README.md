We obtain daily information from [Shanghai Municipal Health Commission](https://wsjkw.sh.gov.cn/) on: the number of confirmed cases and asymptomatic infections by district and county during the outbreak and Shanghai as a whole, the number of asymptomatic infections released from medical observation, and the number of cured cases, etc. Our codes and data can be found at https://github.com/Bai-Yu-Lan/SH-COVID19.



我们每天从[上海卫健委](https://wsjkw.sh.gov.cn/)的官方网站获取：疫情期间各个区县以及上海市整体每日新增的确诊病例与无症状感染者数量与居住地、解除医学观察无症状感染者人数、治愈出院人数等信息。我们的代码与数据可以在https://github.com/Bai-Yu-Lan/SH-COVID19 获取。



## Relevant Residence Information  患者居住地信息



After manually obtaining the relevant residence information on that day from the Shanghai Municipal Health Commission, through [update_address.ipynb](https://github.com/Bai-Yu-Lan/SH-COVID19/blob/main/source/code/update_addresses.ipynb), we update [all_addresses.npy](https://github.com/Bai-Yu-Lan/SH-COVID19/blob/main/source/data/居住地信息_processed/all_addresses.npy) containing all addresses, and then obtain the district and street to which the new address belongs, the corresponding POI name and type, and the corresponding latitude and longitude coordinates through the Baidu Map API.

> For example, for No. 600 Yishan Road, Xuhui District, we can get: Shanghai, Xuhui District, Tianlin Street, Shanghai Sixth People's Hospital, Medical, (121.420···, 31.181···)



从上海卫健委手动获取当日患者的居住地信息之后，通过[update_address.ipynb](https://github.com/Bai-Yu-Lan/SH-COVID19/blob/main/source/code/update_addresses.ipynb)，我们更新包含所有地址的[all_addresses.npy](https://github.com/Bai-Yu-Lan/SH-COVID19/blob/main/source/data/居住地信息_processed/all_addresses.npy)，然后通过百度地图API获取新增地址所属区县与街道、对应的POI名称与类型、对应的经纬度坐标。

> 例如，对于徐汇区宜山路600号，可以得到：上海市，徐汇区，田林街道，上海市第六人民医院，医疗，(121.420···,  31.181···)



Since there are multiple address information corresponding to the same POI in the residence information, we encode each coordinate point in the format of `[province and city]-[district]-[town]-[latitude and longitude]` in order to facilitate the visualization.

> For example, Shanghai, Xuhui District, Tianlin Street, (121.420···, 31.181···) -> 021-01-02-123.
>
> ,where Xuhui district corresponds to district code 01, Tianlin street corresponds to Xuhui district street code 02, (121.420···, 31.181···) corresponds to Tianlin street coordinate point code 123.



由于居住地信息中存在多个地址信息对应同一个POI的情况，为了便于进行可视化，我们以 `[省市]-[区县]-[街道]-[经纬度]` 的格式对每一个坐标点进行编码。

> 例如，上海市，徐汇区，田林街道，(121.420···,  31.181···)  -> 021-01-02-123，
>
> 其中，徐汇区对应区县编码01，田林街道对应徐汇区街道编码02，(121.420···,  31.181···) 对应田林街道的坐标点编码123



With such coding, we can correctly count the number of times POI was notified within 21 days, and store all POI notified in Shanghai in [daily_report_by_address.csv](https://github.com/Bai-Yu-Lan/SH-COVID19/blob/main/source/data/CaseInfo/daily_report_by_address.csv): if it was notified on the same day, the corresponding position will be set to 1.



通过这样的编码方式，我们可以正确统计POI在21天之内被通报次数的情况，将上海所有POI被通报情况存入[daily_report_by_address.csv](https://github.com/Bai-Yu-Lan/SH-COVID19/blob/main/source/data/CaseInfo/daily_report_by_address.csv)中：若当日被通报，则对应位置将被置为1。



| addressID     | 0309 | 0310 | ...  | 0423 |
| ---------- | ---- | ---- | --- | ---- |
| 0210610055 | 0    | 1    | ...  | 1    |
| ...        | ...  | ...  | ...  | ...  |
| 0210607004 | 1    | 0    | ...  | 0    |



## Occupancy of Medical Resources 医疗资源使用情况



In this section, we estimate the current occupancy of the module hospitals (Fangcang) by counting the number of new asymptomatic infections in the daily closed-loop management and social screening in Shanghai and the number of asymptomatic infections discharged from daily observation; we estimate the occupancy of hospitals by counting the number of new diagnoses per day and the number of discharges per day. Due to the lack of data on the number of asymptomatic infected persons released from daily observation in each district and county, we are unable to estimate the use of the pods at the district and county level for the time being.



在这一部分中，我们通过统计上海每日闭环管理与社会面筛查中新增的无症状感染者、每日解除观察的无症状感染者来估计目前方舱的占用情况；通过统计每日新增确诊人数、每日出院人数来估计医院的占用情况。由于缺少各个区县每日解除观察无症状感染者的数据，我们暂时无法估计区县级别方舱使用情况。




