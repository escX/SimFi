const { task } = require('hardhat/config');
const fs = require('fs');
const path = require('path');

// 遍历文件夹下的文件
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (stat.isFile()) {
      callback(filePath);
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
  walkDir(sourceFolder, (filePath) => {
    const relativePath = path.relative(sourceFolder, filePath);
    const targetPath = path.join(targetFolder, relativePath);
    copyFile(filePath, targetPath);
  });
});
