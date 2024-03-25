/**
 * @dev 从多个Event中获取数据
 * @param {Promise[]} listeners 监听方法数组
 * @param {Promise} action 被监听动作
 * @param {number} timeout 超时时间
 * @example
 * const dataFromEvent = await watchAction([async function (resolve) {
 *   await contract.once("EventName", function (...data) {
 *     resolve(data);
 *   });
 * }], async function () {
 *   await contract.method();
 * });
 */

async function watchAction(listeners, action, timeout = 10000) {
  const listenersWrap = listeners.map(listener => new Promise((resolve, reject) => listener(resolve)));

  return new Promise(async (resolve, reject) => {
    setTimeout(() => {
      reject(new Error("timeout"));
    }, timeout);

    Promise.all(listenersWrap).then(resultList => {
      resolve(resultList);
    })

    try{
      await action();
    } catch(error) {
      reject(error);
    }
  })
}

module.exports = {
  watchAction
}
