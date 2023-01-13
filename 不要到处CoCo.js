// ==UserScript==
// @name         不要到处coco
// @namespace    https://wydevops.coding.net/
// @version      0.5
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

(function () {
  'use strict';
  console.log('注入成功')
  let script = document.createElement('link');
  script.setAttribute('rel', 'stylesheet');
  script.setAttribute('type', 'text/css');
  script.href = "https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css";
  document.documentElement.appendChild(script);

  const store = {
    project: {}, iterationId: '', iteration: {}, personHoursMap: {}, story: []
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
          const personHoursMap = store.personHoursMap = {};
          data.list.forEach(item => {
            item.$hours = item.subTasks.reduce((prev, curr, r) => prev + (curr.workingHours || 0), 0);
            item.subTasks.forEach(task => {
              const personName = task.assignee?.name ?? '未分配';
              const person = personHoursMap[personName] = personHoursMap[personName] || {
                tasks: [], workingHours: 0, person: task.assignee
              };
              person.tasks.push(task);
              person.workingHours += task.workingHours;
            })
          });
          store.story = data.list;
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

  async function subTaskDetail(subTextId) {
    const url = `https://wydevops.coding.net/api/project/${store.project.id}/issues/sub-tasks/${subTextId}/activities`
    return new Promise((resolve, reject) => {
      $.ajax({
        url: url,
        data: {},
        type: "get",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        success: function ({data}) {
          //console.log(data)
          resolve(data)
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
          <p><button class="_week_report" data-user="${item.person.id}">生成周报</button></p>
        `
        tabsWrapper.append(div)
        $(li).appendTo(ul);
      })
      $('div[class^="page-container-"]').parent().append(tabsWrapper)
      $('._week_report').click(async (event) => {
        console.log(event.target.dataset.user, store.story);
          let allSubTasks = [];
          store.story.forEach(item => {
              allSubTasks = [...allSubTasks, ...(item.subTasks.map(item1 => ({...item1, epic: item.epic || {code: 0, name: '无史诗'}, story: {code: item.code, name: item.name} })))]
          })
          console.log(allSubTasks);
          const processingTasks = allSubTasks.filter(item => item.assignee.id == event.target.dataset.user).filter(item => item.issueStatus.type !== 'TODO');
          const codes = processingTasks.map(item => item.code);
          const weekly_tasks = [];
          for(const code of codes){
            const subTaskLogs = await subTaskDetail(code);
            const _logs = subTaskLogs.filter(item => item.issueLog.target === 'STATUS')
            const log = _logs[_logs.length - 1];
            const time = new Date(log.createdAt)
            if(isCurrentWeek(time)){
               weekly_tasks.push(processingTasks.find(item => item.code === code))
            }
            console.log(code, time)
          }
          const epicMap = {};
          weekly_tasks.forEach(item => {
              epicMap[item.epic.code] = epicMap[item.epic.code] || [];
              epicMap[item.epic.code].push(item)
          })
          const groupByEpic = Object.entries(epicMap).map(([epicCode, tasks]) => ({...tasks[0].epic, tasks}))
          console.log(groupByEpic)
          let text = ``;
          groupByEpic.forEach((epic, index) => {
              if(epic.code)
                  text += `<b style="font-weight: bold;">${index + 1}、<a href="https://wydevops.coding.net/p/${store.project.name}/epics/issues/${epic.code}/detail">史诗 ${epic.code}</a> ${epic.name}</b>`
              else
                  text += `<b>${index + 1}、其他（无史诗）</b>`
              text += `<ul>`
              epic.tasks.forEach(task => {
                  text += `<li>
                  <a href="https://wydevops.coding.net/p/${store.project.name}/requirements/issues/${task.story.code}/detail" title="${task.story.name}">故事 ${task.story.code}</a>
                   / <a href="https://wydevops.coding.net/p/${store.project.name}/requirements/issues/${task.story.code}/detail/subissues/${task.code}">任务 ${task.code}</a>
                  ：${task.name} <span style="color: red">—— ${task.issueStatus.name}</span>
                  </li>`
              });
              text += `</ul><br/>`;
          })
          const MIMETYPE = "text/html";

          var data = [new ClipboardItem({ [MIMETYPE]: new Blob([text], { type: MIMETYPE }) })];
          navigator.clipboard.write(data).then(function () {
              alert("复制成功！去试试粘贴到Excel内吧～")
          }, function () {
              alert("不知道怎么回事，再试一次吧！")
              console.error("Unable to write to clipboard. :-(");
          });

      })
      // const img = document.createElement('img');
      // img.src = `https://vkceyugu.cdn.bspapp.com/VKCEYUGU-3ca7fba5-3cfa-402c-aaec-2b3e431e262d/226c3600-5069-429d-95be-79bce56a1796.png`;
      // tabsWrapper.append(img)
      // tabsWrapper.append($('div[class^="page-container-"]').parent())
      // $(function () {
      $(`#${ID_VALUE}`).tabs({
        collapsible: true
      });
      const incept = debounce(() => {
        store.story.forEach(item => {
          const dom = $(`a[href^='/p/${store.project.name}/requirements/issues/${item.code}/detail']`);
          // console.log(dom, item.$hours);
          try {
            const td = dom.parent().parent().parent().parent().children()[1];
            td.style.position = 'relative';
            $(td).append(`<div sp style='  position: absolute;
                                      left: 32px;
                                      bottom: -2px;
                                      color: #ffa200;
                                      font-weight: bold;'>${item.$hours}</div>`)
          } catch (e) {
          }
          /*
        dom.append(`<div sp style='  position: absolute;
                                    left: auto;
                                    bottom: 0;
                                    color: #ffa200;
                                    font-weight: bold;'>${item.$hours}</div>`) */
        });
      })

      $('table').scroll(() => {
        incept()
      })
      $('table').click(() => {
        incept()
      })
      incept()
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

  function debounce(fn) {
    let t = null
    return function () {
      if (t) {
        clearTimeout(t)
      }
      t = setTimeout(() => {
        fn.apply(this, arguments);
      }, 200)
    }
  }

  // Your code here...

    function isCurrentWeek(past) {
        const pastTime = new Date(past).getTime()
        const today = new Date(new Date().toLocaleDateString())
        let day = today.getDay()
        day = day == 0 ? 7 : day
        const oneDayTime = 60*60*24*1000
        const monday = new Date(today.getTime() - (oneDayTime * (day - 1)))
        const nextMonday = new Date(today.getTime() + (oneDayTime * (8 - day)))
        if(monday.getTime() <= pastTime && nextMonday.getTime() > pastTime) {
            return true
        } else {
            return false
        }
    }
})();
