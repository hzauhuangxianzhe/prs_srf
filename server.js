const express = require("express");
const multer = require("multer");
const SftpClient = require("ssh2-sftp-client");
const { Client } = require("ssh2");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const winston = require("winston");
const nodemailer = require("nodemailer");

// 创建日志记录器
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`
    )
  ),
  transports: [
    new winston.transports.File({ filename: "server.log" }),
    new winston.transports.Console(),
  ],
});

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const sftp = new SftpClient();

const sftpConfig = {
  host: '218.199.69.19', // 新的远程服务器IP地址
  port: 528,             // 新的远程服务器端口
  username: 'prs_srf_2023',
  password: 'eg06naRp*QEoCOH6'
};

const sshConfig = {
  host: sftpConfig.host,
  port: sftpConfig.port,
  username: sftpConfig.username,
  password: sftpConfig.password,
};

// 确保下载目录存在
const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// 配置邮箱
const transporter = nodemailer.createTransport({
  service: '163', // 邮件服务提供商
  auth: {
    user: 'hzauhuangxianzhe@163.com', // 您的163邮箱地址
    pass: 'KBAYINDADYCSUHRL' // 您的163邮箱授权码
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  logger.info("收到上传请求");
  if (!req.file) {
    logger.error("未上传文件");
    return res.status(400).send({ error: "未上传文件" });
  }

  const localFilePath = path.join(__dirname, req.file.path);
  const remoteFilePath = `/home/prs_srf_2023/user/huangxianzhe/workplace/vue_plink_test_0611/${req.file.originalname}`;
  const remoteResultPath = `/home/prs_srf_2023/user/huangxianzhe/workplace/vue_plink_test_0611/prs_result.png`;
  const localResultPath = path.join(__dirname, "downloads", "prs_result.png");

  logger.info(`本地文件路径: ${localFilePath}`);
  logger.info(`远程文件路径: ${remoteFilePath}`);

  try {
    logger.info("连接到SFTP服务器...");
    await sftp.connect(sftpConfig);
    logger.info("已连接到SFTP服务器");

    logger.info("正在将文件上传到SFTP服务器...");
    await sftp.put(localFilePath, remoteFilePath);
    logger.info("文件已上传到SFTP服务器");

    await sftp.end();
    logger.info("已断开与SFTP服务器的连接");

    fs.unlinkSync(localFilePath);
    logger.info("本地文件已删除");

    logger.info("连接到SSH服务器...");
    const sshClient = new Client();
    sshClient
      .on("ready", () => {
        logger.info("SSH连接已准备好");
        sshClient.exec(
          `bash -c "cd /home/prs_srf_2023/user/huangxianzhe/workplace/vue_plink_test_0611 && /home/prs_srf_2023/miniconda3/envs/py3.11.5/bin/snakemake --cores 4"`,
          (err, stream) => {
            if (err) {
              logger.error(`SSH执行错误: ${err.message}`);
              return res.status(500).send({ error: "无法在SSH服务器上执行脚本" });
            }

            stream
              .on("close", async (code, signal) => {
                logger.info(`脚本执行完成，代码: ${code}, 信号: ${signal}`);
                sshClient.end();

                if (code !== 0) {
                  logger.error(`脚本执行失败，代码: ${code}`);
                  return res.status(500).send({ error: "远程脚本执行失败" });
                }

                logger.info("重新连接到SFTP服务器以下载结果...");
                try {
                  await sftp.connect(sftpConfig);
                  await sftp.fastGet(remoteResultPath, localResultPath);
                  logger.info("结果文件已下载");

                  // 发送邮件通知用户
                  const mailOptions = {
                    from: 'hzauhuangxianzhe@163.com', // 发件人
                    to: '1924630052@qq.com', // 收件人
                    subject: '文件处理完成通知', // 邮件主题
                    text: `您好，您的文件已处理完成。请点击以下链接下载结果文件：\nhttp://localhost:3000/download/prs_result.png` // 邮件内容
                  };

                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      logger.error(`邮件发送错误: ${error.message}`);
                    } else {
                      logger.info(`邮件发送成功: ${info.response}`);
                    }
                  });

                  res.send({
                    message: "文件上传并处理成功",
                    downloadPath: "http://localhost:3000/download/prs_result.png",
                  });
                } catch (err) {
                  logger.error(`SFTP下载错误: ${err.message}`);
                  res.status(500).send({ error: "无法下载结果文件" });
                } finally {
                  await sftp.end();
                }
              })
              .on("data", (data) => {
                logger.info(`SSH输出: ${data}`);
              })
              .stderr.on("data", (data) => {
                logger.error(`SSH错误输出: ${data}`);
              });
          }
        );
      })
      .on("error", (err) => {
        logger.error(`SSH连接错误: ${err.message}`);
        res.status(500).send({ error: "SSH连接失败" });
      })
      .connect(sshConfig);
  } catch (err) {
    logger.error(`错误: ${err.message}`);
    res.status(500).send({ error: "上传并处理文件失败" });
  }
});

app.get("/download/prs_result.png", (req, res) => {
  const filePath = path.join(__dirname, "downloads", "prs_result.png");
  if (!fs.existsSync(filePath)) {
    logger.error("结果文件不存在");
    return res.status(404).send({ error: "结果文件不存在" });
  }

  res.download(filePath, "prs_result.png", (err) => {
    if (err) {
      logger.error(`下载错误: ${err.message}`);
      res.status(500).send({ error: "无法下载文件" });
    } else {
      logger.info("文件下载成功");
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`服务器正在端口 ${PORT} 上运行`);
});
