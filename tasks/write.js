const { task } = require('hardhat/config');
const fs = require('fs');
const path = require('path');

// 遍历文件夹下的文件
function walkDir(sourceFolder, callback) {
  fs.readdirSync(sourceFolder).forEach(folderName => {
    const folderPath = path.join(sourceFolder, folderName);
    const folderStat = fs.statSync(folderPath);
    if (folderStat.isDirectory()) {
      fs.readdirSync(folderPath).forEach(fileName => {
        const filePath = path.join(folderPath, fileName);
        const fileStat = fs.statSync(filePath);
        if (fileStat.isFile() && filePath.endsWith('.json') && !filePath.endsWith('.dbg.json')) {
          callback(filePath, fileName);
        }
      })
    }
  });
}

// 复制文件到目标文件夹
function copyFile(source, target) {
  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(source, target);
}

task("write", "Write smart contract data file to frontend", async (taskArgs, hre) => {
  const sourceFolder = path.join(__dirname, "..", "artifacts", "contracts");
  const targetFolder = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  // 遍历源文件夹并复制文件到目标文件夹
  walkDir(sourceFolder, (filePath, fileName) => {
    const targetPath = path.join(targetFolder, fileName);
    copyFile(filePath, targetPath);
  });
});
