# SimFi
本项目由多个智能合约，以及可视化合约操作的前端项目组成，可以用来模拟一些简单的经济金融活动。

智能合约项目使用`Hardhat + ethers.js`开发，前端项目使用`React + Next.js + And Design`开发。

## 启动
1. 克隆项目到本地
2. 进入项目目录，`cd ./SimFi`
3. 安装依赖项，`npm install`
4. 编译智能合约、拷贝编译后文件到前端项目、启动Hardhat网络，`npm run start`
5. 进入前端项目，`cd ./frontend`
6. 安装依赖项，`npm install`
7. 启动前端项目，`npm run dev`
8. 在浏览器中打开 [http://localhost:3000/](http://localhost:3000/)

## 智能合约
### SFT.sol
本项目将会使用的符合`ERC20`规范的代币合约。

## 前端项目
前端项目可以通过可视化的方式，部署本项目中的智能合约，执行已部署智能合约的方法，并记录操作历史。

项目地址：[SimFi Frontend](https://github.com/escX/SimFi/tree/main/frontend)。
