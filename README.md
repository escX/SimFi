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
### DebT.sol
本项目中使用的债务合约。要理解它，您需要知道以下几点：
1. 债务是一类资产，可以进行流通交易。为了方便理解和计算，可以将债务视为一种特殊的代币（本项目中使用`DebtToken`表示），它和普通代币（在本项目中指`SFT`）存在一个浮动的兑换比率，这个利率本质上由市场状况和市场对债务人的偿还预期所决定。
2. `DebtToken`由债务人铸造，每一个`DebtToken`在铸造时，都会被赋予四个固定属性：债务人账户地址、分期期数（为方便模拟，本项目约定每期固定时长为一分钟）、每期承诺偿还债权人的`SFT`数量、每期违约金。只要`DebtToken`拥有相同的这四个属性（在智能合约中，表现为由这四个属性生成的唯一哈希值`DebtTokenHash`），可以视为同一种`DebtToken`，具有相同的价值和兑换比率。这意味着债务人可以多次分批铸造相同的`DebtToken`。
3. `DebtToken`铸造后，只有在确认债权人后，才会在每期期限内，由债务人向债权人偿还承诺数量的`SFT`。若违约，将顺延分期，同时在此后每期中，按照每期违约金，增加债务人应偿还的`SFT`数量。
4. `DebtToken`只能由债务人铸造，在确认债权人前，可以被债务人销毁；一旦确认了债权人，只能在债务人偿还完所有分期的`SFT`后，才会自动销毁。
5. `DebtToken`的债务人不会变化，但可以通过交易，改变债权人。`DebtToken`可以和`SFT`和其他不同哈希的`DebtToken`进行交易。这一过程将在交易所合约`Exchange`中实现。
> 注意：该合约为了使用可以在本地运行的`chinklink`，引入了`@chainlink/hardhat-chainlink`插件，这个插件在`window`系统运行需要`python`和`Visual Studio Community`，在其他平台也有相应的系统要求。
>
> 想了解更多，或者您在安装`@chainlink/hardhat-chainlink`的过程中出现任何问题，可以在[node-gyp](https://github.com/nodejs/node-gyp)寻求可能的解决方案。

## 前端项目
前端项目可以通过可视化的方式，部署本项目中的智能合约，执行已部署智能合约的方法，并记录操作历史。

项目地址：[SimFi Frontend](https://github.com/escX/SimFi/tree/main/frontend)。
