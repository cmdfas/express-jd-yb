const express = require('express')
const cors = require('cors');
const path = require('path')
const fs = require('fs')

var app = express();

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use(cors())


app.get('/get', (req, res) => {

  const data = []

  // 获取指定日期的总销量
  const getTotal = (date) => {
    const filePath = path.join(__dirname, 'data', `${date}.json`)
  
    if (!fs.existsSync(filePath)) {
      return 0
    }
    
    const data = JSON.parse(fs.readFileSync(filePath))

    if (data.total) {
      return data.total;
    }
  
    const total = data.data.reduce((total, currentValue) => {
      return total + Math.floor(currentValue) / 10000;
    })
    // 缓存总数，下次就不用计算了
    data.total = total; // 单位万
    fs.writeFileSync(filePath, JSON.stringify(data))

    return total;
  }

  // 获取指定日期的上一天
  const getLastDay = (dateTime) => {
    let date_ob = new Date(dateTime);
    date_ob.setDate(date_ob.getDate() - 1)
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let today = year + "-" + month + "-" + date;
    return today
  }

  // 所有统计日期的数据
  const dateList = fs.readdirSync(path.join(__dirname, 'data'))

  // 返回数据，计算较上一日增加情况
  dateList.forEach(fileName => {
    const date = fileName.replace('.json', '')
    data.push({
      date,
      total: Math.floor(getTotal(date) / 10000) + '亿',
      thanLastDay: getTotal(getLastDay(date)) !== 0 ? Math.floor(getTotal(date) - getTotal(getLastDay(date))) + '万' : '暂无数据'
    })
  })

  // 按日期降序排列
  res.send(data.sort((a,b) => new Date(b.date) - new Date(a.date)))
});

app.post('/save', (req, res) => {

  // 获取当前日期
  let date_ob = new Date();
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();
  let today = year + "-" + month + "-" + date;

  // 文件路径
  const filePath = path.join(__dirname, 'data', `${today}.json`)
  
  // 如果不存在存储文件
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({data: []}))
  }
  // 读取文件
  const data = JSON.parse(fs.readFileSync(filePath))
  // 存入当前页所有商品下销售额
  data.data.push(req.body.pageTotal)
  // 写入到json文件
  fs.writeFileSync(filePath, JSON.stringify(data))
  // 返回数据
  res.send(data);
});

// Error handler
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(500).send('Internal Serverless Error');
});

app.listen(9000, function () {
  console.log('服务启动成功：http://localhost:9000');
});