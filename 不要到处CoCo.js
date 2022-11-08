// ==UserScript==
// @name         不要到处coco
// @namespace    https://wydevops.coding.net/
// @version      0.4
// @description  不潮不用花钱
// @author       你
// @match        https://wydevops.coding.net/*
// @require      http://code.jquery.com/jquery-2.1.1.min.js
// @require      http://code.jquery.com/ui/1.11.0/jquery-ui.min.js
// @resource      https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @license MIT
// ==/UserScript==

(function() {
  'use strict';
  console.log('注入成功')
  let script = document.createElement('link');
  script.setAttribute('rel', 'stylesheet');
  script.setAttribute('type', 'text/css');
  script.href = "https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css";
  document.documentElement.appendChild(script);

  const store = {
    project: {}, iterationId: '', iteration: {}, personHoursMap: {}
  }

  window.history.pushState = (fn => function pushState() {
    var ret = fn.apply(this, arguments)
    console.log('pushState')
    window.dispatchEvent(new Event('pushstate'))
    window.dispatchEvent(new Event('locationchange'))
    return ret
  })(window.history.pushState)

  window.history.replaceState = (fn => function replaceState() {
    console.log('replaceState')
    var ret = fn.apply(this, arguments)
    window.dispatchEvent(new Event('replacestate'))
    window.dispatchEvent(new Event('locationchange'))
    return ret
  })(window.history.replaceState)

  window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'))
  })
  const ID_VALUE = 'coco-tabs';
  const main = async () => {
    if (!/^\/p(.+)\//.test(location.pathname)) return;

    const projectName = /^\/p\/(.+?)\//.exec(location.pathname)[1];
    if (store.project.name !== projectName) {
      await getProjectId(projectName)
    }
    const iterationId = new RegExp(`^\/p\/${projectName}\/iterations\/(.+?)\/`).exec(location.pathname)[1];
    if (store.iterationId !== iterationId) {
      $(`#${ID_VALUE}`).remove()
      store.iterationId = iterationId;
      await getIteration();
      await getSubTree();

      render()
    }
  }

  setInterval(() => {
    main();
    hackLiYang();
  }, 500)

  window.addEventListener('locationchange', main)

  window.onload = main
  // chrome.runtime.sendMessage({
  //   TYPE: 'main'
  // }, (response) => {
  //   console.log(response)
  // })



  const getProjectId = async function (projectName) {
    // const data = new FormData()
    // Object.entries(courseData).forEach(([key, value]) => {
    //   data.append(key, String(value))
    // })
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `https://wydevops.coding.net/api/platform/project/${projectName}`,
        data: {},
        type: "get",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        success: function ({data}) {
          console.log(data)
          store.project = data;
          resolve()
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          console.error(arguments)
          reject(errorThrown)
        }
      });
    })

  }

  const getSubTree = async function () {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `https://wydevops.coding.net/api/project/${store.project.id}/iterations/${store.iterationId}/issues/subtask-tree?keywords=&sortBy=ISSUE_ITERATION_SORT%3AASC&showSubIssues=false&page=1&pageSize=500`,
        data: {},
        type: "get",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        success: function ({data}) {
          console.log('getSubTree', data);
          const personHoursMap = store.personHoursMap = {}
          data.list.forEach(item => {
            item.subTasks.forEach(task => {
              const personName = task.assignee?.name ?? '未分配';
              const person = personHoursMap[personName] = personHoursMap[personName] || {
                tasks: [], workingHours: 0, person: task.assignee
              };
              person.tasks.push(task);
              person.workingHours += task.workingHours;
            })
          })
          console.log(store.personHoursMap)
          resolve(personHoursMap)
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          console.error(arguments)
          reject(errorThrown)
          //layer.alert('课程进度更新错误：' + errorThrown, { icon: 0 });
        }
      });
    })
  }

  async function getIteration() {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `https://wydevops.coding.net/api/project/${store.project.id}/iterations/${store.iterationId}`,
        data: {},
        type: "get",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        success: function ({data}) {
          console.log(data)
          store.iteration = data;
          resolve()
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          console.error(arguments)
          reject(errorThrown)
        }
      });
    })
  }


  function render() {
    window.$ = $
    const iterationRate = Number(((1 - store.iteration.remainingDays / ((store.iteration.endAt - store.iteration.startAt) / 3600 / 24 / 1000))).toFixed(2));
    const interval = setInterval(() => {
      // 渲染
      const tableDom = $('table');
      if (!tableDom.length) {
        return
      }
      clearInterval(interval)
      console.log(tableDom)
      const tabsWrapper = document.createElement('div');
      tabsWrapper.id = ID_VALUE;
      const ul = document.createElement('ul');
      $(ul).appendTo(tabsWrapper)
      Object.entries(store.personHoursMap).sort((a, b) => b[1].workingHours - a[1].workingHours).forEach(([personName, item], index) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${ID_VALUE}-${index + 1}`
        a.innerText = `${personName}(${item.workingHours})`;
        if (!item.person) {
          a.style.color = 'red'
        }
        $(a).appendTo(li);
        const div = document.createElement('div');
        div.id = `${ID_VALUE}-${index + 1}`;
        div.style.display = 'none';
        const subs = item.tasks.filter(item => item.issueTypeDetail.name === '子工作项');
        const completed = subs.filter(item => item.issueStatus.name === '已完成');
        const completedHours = reduceByProp(completed, 'workingHours');
        const subsHours = reduceByProp(subs, 'workingHours');
        const hoursRate = completedHours / subsHours;
        const deltaRate = hoursRate - iterationRate;
        div.innerHTML = `
          <p>子工作项进度：<b>${completed.length}</b>/${subs.length}&nbsp;&nbsp;&nbsp;&nbsp;完成率：<b>${formatRate(completed.length / subs.length)}</b></p>
          <p>工时进度：
            <b>${reduceByProp(completed, 'workingHours')}</b>/${reduceByProp(subs, 'workingHours')}&nbsp;&nbsp;&nbsp;&nbsp;
            完成率：<b>${formatRate(reduceByProp(completed, 'workingHours') / reduceByProp(subs, 'workingHours'))}</b>&nbsp;&nbsp;&nbsp;&nbsp;
            <b style="color: ${deltaRate > 0 ? 'green' : 'red'}">${deltaRate > 0 ? '⬆' : '⬇'}</b>${formatRate(deltaRate)}（期望：${formatRate(iterationRate)}）
          </p>
        `
        tabsWrapper.append(div)
        $(li).appendTo(ul);
      })
      $('div[class^="page-container-"]').parent().append(tabsWrapper)
      // const img = document.createElement('img');
      // img.src = `https://vkceyugu.cdn.bspapp.com/VKCEYUGU-3ca7fba5-3cfa-402c-aaec-2b3e431e262d/226c3600-5069-429d-95be-79bce56a1796.png`;
      // tabsWrapper.append(img)
      // tabsWrapper.append($('div[class^="page-container-"]').parent())
      // $(function () {
      $(`#${ID_VALUE}`).tabs({
        collapsible: true
      });
      // });
      // tableDom.parentNode.insertBefore(document.createElement('div'), tableDom)
    }, 200)
  }

  function hackLiYang() {
    try {
      // Array.from($('img')).forEach(el => {
      //   el.src = `https://vkceyugu.cdn.bspapp.com/VKCEYUGU-3ca7fba5-3cfa-402c-aaec-2b3e431e262d/226c3600-5069-429d-95be-79bce56a1796.png`;
      //   const style = {
      //     animationName: 'loadingCircle',
      //     animationDuration: '1s',
      //     animationIterationCount: 999999,
      //     animationDelay: '1.2s',
      //   }
      //   Object.entries(style).forEach(([name, value]) => el.style[name] = value)
      // })
      const el = $('a[class^="enterprise-trigger-logo-"] > img')[0];
      el.src = `https://vkceyugu.cdn.bspapp.com/VKCEYUGU-3ca7fba5-3cfa-402c-aaec-2b3e431e262d/226c3600-5069-429d-95be-79bce56a1796.png`;
      const style = {
        animationName: 'loadingCircle',
        animationDuration: '1s',
        animationIterationCount: 999999,
        animationDelay: '1.2s',
      }
      Object.entries(style).forEach(([name, value]) => el.style[name] = value)
    } catch (e) {

    }
  }


  function reduceByProp(arr, prop) {
    return arr.reduce((total, curr) => {
      return total += (curr[prop] || 0)
    }, 0)
  }

  function formatRate(number) {
    return (Number(number) * 100).toFixed(2) + '%'
  }

  // Your code here...
})();
