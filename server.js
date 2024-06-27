// server.js

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const cron = require("node-cron");
const compression = require("compression");
const userRoutes = require('./routes/user.routes');
const { fa, fetchDataAndCache } = require("./controllers/fa.controller");
const All = require("./models/fa_CustomerData.model"); // Ensure correct import path
const Alltest = require("./models/fa_Alltest.model");
const OTsales = require("./models/fa_OTsales.model");
const logger = require("./controllers/logger");
const fs = require("fs");
const excelJS = require("exceljs");
const SalesRepo0 = require('./models/fa_SalesRepo0.model');
const CustomerData = require("./models/fa_CustomerData.model"); // Ensure correct import path

const { Model } = require("objection");
const knex = require("./database");

Model.knex(knex);

const app = express();
const PORT = process.env.PORT || 3003;

app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api/users', userRoutes);

// Export endpoints for CustomerData, Alltest, OTsales, SalesRepo0
app.post("/v1/CustomerData", (req, res) => fa(req, res, CustomerData));
app.post("/v1/Alltest", (req, res) => fa(req, res, Alltest));
app.post("/v1/OTsales", (req, res) => fa(req, res, OTsales));
app.post("/v1/SalesRepo0", (req, res) => fa(req, res, SalesRepo0));

// Endpoint to fetch logs
app.get("/v1/logs", (req, res) => {
  const content = fs.readFileSync(`./combined.log`, {
    encoding: "utf8",
    flag: "r",
  });
  res.send(content);
});

// Export OTsales route with filtering options
app.get("/v1/export-otsales", async (req, res) => {
  try {
    const { sourceDb, year, buyerName } = req.query;

    let query = OTsales.query();

    if (sourceDb) {
      query = query.where('SourceDb', sourceDb);
    }

    if (year) {
      query = query.whereRaw('YEAR(FsDate) = ?', [year]);
    }

    if (buyerName) {
      query = query.where('buyername', 'like', `%${buyerName}%`);
    }

    const data = await query;

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('OTSales');
    worksheet.columns = [
      { header: 'Buyer Name', key: 'buyername', width: 15 },
      { header: 'Tel No', key: 'TelNo', width: 10 },
      { header: 'Fsr Printer No', key: 'FsrPrinterNo', width: 15 },
      { header: 'Fs No', key: 'FsNo', width: 10 },
      { header: 'Fs Date', key: 'FsDate', width: 10 },
      { header: 'Year', key: 'Year', width: 10 },
      { header: 'Month', key: 'Month', width: 15 },
      { header: 'Fs Time', key: 'Fstime', width: 10 },
      { header: 'Pos Start Prt Time', key: 'PosStartPrtTime', width: 20 },
      { header: 'Source Db', key: 'SourceDb', width: 10 },
      { header: 'Sales Order No', key: 'SalesOrderNo', width: 15 },
      { header: 'Total Price', key: 'TotalPrice', width: 10 },
      { header: 'Description', key: 'Description', width: 20 },
    ];

    worksheet.addRows(data);

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=OTSales.xlsx');
    res.send(buffer);
  } catch (err) {
    console.error('Error exporting OTsales data:', err);
    res.status(500).send({
      error: err.message,
    });
  }
});

// Export SalesRepo0 route with filtering options
app.get("/v1/export-salesreport", async (req, res) => {
  try {
    const { sourceDb, year, buyerName } = req.query;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=SalesReport0.xlsx');

    const workbook = new excelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const worksheet = workbook.addWorksheet('SalesReport0', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A1' }]
    });

    worksheet.columns = [
      { header: 'Buyer Name', key: 'buyername', width: 15 },
      { header: 'Year', key: 'SaleYear', width: 10 },
      { header: 'Tin No', key: 'TinNo', width: 10 },
      { header: 'Fsr Printer No', key: 'FsrPrinterNo', width: 15 },
      { header: 'Fs No', key: 'FsNo', width: 10 },
      { header: 'Fs Date', key: 'FsDate', width: 10 },
      { header: 'Fs Time', key: 'Fstime', width: 10 },
      { header: 'Pos Start Prt Time', key: 'PosStartPrtTime', width: 20 },
      { header: 'Source Db', key: 'SourceDb', width: 10 },
      { header: 'Sales Order No', key: 'SalesOrderNo', width: 15 },
      { header: 'Total Price', key: 'TotalPrice', width: 10 },
      { header: 'Description', key: 'Description', width: 20 },
    ];

    const pageSize = 700000; // Number of records to fetch per page
    let offset = 0; // Initial offset

    const streamDataToExcel = async () => {
      while (true) {
        let query = SalesRepo0.query()
          .orderBy('FsNo')
          .orderBy('SalesOrderNo')
          .offset(offset)
          .limit(pageSize);

        if (sourceDb) {
          query = query.where('SourceDb', sourceDb);
        }

        if (year) {
          query = query.whereRaw('YEAR(FsDate) = ?', [year]);
        }

        if (buyerName) {
          query = query.where('buyername', 'like', `%${buyerName}%`);
        }

        const data = await query;

        if (data.length === 0) break; // No more records to fetch

        data.forEach(item => {
          worksheet.addRow({
            buyername: item.buyername,
            SaleYear: item.SaleYear,
            TinNo: item.TinNo,
            FsrPrinterNo: item.FsrPrinterNo,
            FsNo: item.FsNo,
            FsDate: item.FsDate,
            Fstime: item.Fstime,
            PosStartPrtTime: item.PosStartPrtTime,
            SourceDb: item.SourceDb,
            SalesOrderNo: item.SalesOrderNo,
            TotalPrice: item.TotalPrice,
            Description: item.Description,
          }).commit();
        });

        offset += pageSize;
      }

      await worksheet.commit();
      await workbook.commit();
    };

    await streamDataToExcel();
  } catch (err) {
    console.error("Error exporting SalesReport0:", err);
    res.status(500).send({
      error: err.message,
    });
  }
});

// Export CustomerData route with filtering options
app.get("/v1/export-customerdata", async (req, res) => {
  try {
    const { year, buyerName } = req.query;

    let query = CustomerData.query();

    if (year) {
      query = query.where('Year', year);
    }

    if (buyerName) {
      query = query.where('BuyerName', 'like', `%${buyerName}%`);
    }

    const data = await query;

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('CustomerData');
    worksheet.columns = [
      { header: 'Buyer Name', key: 'BuyerName', width: 15 },
      { header: 'Year', key: 'Year', width: 10 },
      { header: 'FrqPerYear', key: 'FrqPerYear', width: 15 },
      { header: 'RankFrqPerYear', key: 'RankFrqPerYear', width: 20 },
      { header: 'TotalFrq', key: 'TotalFrq', width: 15 },
      { header: 'RankTotalFrq', key: 'RankTotalFrq', width: 15 },
      { header: 'TotalSales', key: 'TotalSales', width: 15 },
      { header: 'RankTotalSales', key: 'RankTotalSales', width: 15 },
    ];

    worksheet.addRows(data);

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=CustomerData.xlsx');
    res.send(buffer);
  } catch (err) {
    console.error('Error exporting customer data:', err);
    res.status(500).send({
      error: err.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Fetch and cache data every midnight
cron.schedule("0 0 * * *", () => {
  fetchDataAndCache();
});
