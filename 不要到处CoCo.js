// ==UserScript==
// @name         不要到处coco
// @namespace    https://wydevops.coding.net/
// @version      1.0.3
// @description  coding增强
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
    } else {
      if ($(`#${ID_VALUE}`) && $(`#${ID_VALUE}`).length) {
        /// console.log(666)
        $('table').scroll(() => {
          incept()
        })
        $('table').click(() => {
          incept()
        })
        incept()
      } else {
        render();
      }

    }
  }

  async function rerender() {
    $(`#${ID_VALUE}`).remove()
    store.iterationId = iterationId;
    await getIteration();
    await getSubTree();

    render();
  }

  setInterval(() => {
    main();
    hackLiYang();
  }, 1000)

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
            if (item.subTasks.length === 0) {
              item.subTasks = item.subIssues.filter(it => it.type === "SUB_TASK")
            }
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

  const incept = debounce(() => {
    store.story.forEach(item => {
      const dom = $(`a[href^='/p/${store.project.name}/requirements/issues/${item.code}/detail']`);
      // console.log(dom, item.$hours);
      try {
        const td = dom.parent().parent().parent().parent().children()[1];
        if ($(td).find('div.spspspspsp').length) return;
        td.style.position = 'relative';
        // `<div class="tag-OnRxknb07m epic-1Eg_rPGjj7"><div class="icon-24obWj6mLq"></div><div class="detail-hc4p8Zzxbo">【保洁】【保洁-0324】新增</div></div>`
        $(td).prepend(`<div sp class="spspspspsp tag-OnRxknb07m epic-1Eg_rPGjj7"><div class="icon-24obWj6mLq"></div><div class="detail-hc4p8Zzxbo">${`${item.$hours}`.slice(0, 5)}/<span style="color: #ffa200">${fiberMatch(item.$hours)}</span></div></div>`)
        /*$(td).append(`<div sp style='position: absolute; font-size: 12px;
                                      left: 32px;
                                      bottom: -2px;
                                      color: #222;
                                      font-weight: bold;'>${item.$hours}/<span style="color: #ffa200">${fiberMatch(item.$hours)}</span></div>`)*/
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
  let interval = null;

  function render() {
    window.$ = $
    interval && clearInterval(interval)
    const iterationRate = Number(((1 - store.iteration.remainingDays / ((store.iteration.endAt - store.iteration.startAt) / 3600 / 24 / 1000))).toFixed(2));
    interval = setInterval(() => {
      // 渲染
      const tableDom = $('table');
      if (!tableDom.length) {
        return
      }
      interval && clearInterval(interval)
      console.log(tableDom)
      // tableDom.prepend(`<button class="new-button-1kWt8bSwah default-14YlfkOcgs h-32-1KvNA1yjmi">一键更新故事点</button>`)
      const tabsWrapper = document.createElement('div');
      tabsWrapper.id = ID_VALUE;
      const ul = document.createElement('ul');
      if ($(`#${ID_VALUE}`) && $(`#${ID_VALUE}`).length) {
        $(`#${ID_VALUE}`).remove()
      }
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
        let innerHTML = `
          <p>
          子工作项进度：<b>${completed.length}</b>/${subs.length}&nbsp;&nbsp;&nbsp;&nbsp;完成率：<b>${formatRate(completed.length / subs.length)}</b>`;
        item.person && (innerHTML += `<button class="_week_report new-button-1kWt8bSwah default-14YlfkOcgs h-32-1KvNA1yjmi" style="margin-left: 12px" data-user="${item.person.id}">生成周报</button>
          <button class="_all_report new-button-1kWt8bSwah default-14YlfkOcgs h-32-1KvNA1yjmi" style="margin-left: 12px" data-user="${item.person.id}">生成迭代报告</button>`)
        innerHTML += `
          </p>
          <p>工时进度：
            <b>${reduceByProp(completed, 'workingHours')}</b>/${reduceByProp(subs, 'workingHours')}&nbsp;&nbsp;&nbsp;&nbsp;
            完成率：<b>${formatRate(reduceByProp(completed, 'workingHours') / reduceByProp(subs, 'workingHours'))}</b>&nbsp;&nbsp;&nbsp;&nbsp;
            <b style="color: ${deltaRate > 0 ? 'green' : 'red'}">${deltaRate > 0 ? '⬆' : '⬇'}</b>${formatRate(deltaRate)}（期望：${formatRate(iterationRate)}）
          </p>
        `
        div.innerHTML = innerHTML;
        tabsWrapper.append(div)
        $(li).appendTo(ul);
      })
      $('div[class^="page-container-"]').parent().append(tabsWrapper)
      $('._week_report').click(async (event) => report_by_time()(event))
      $('._all_report').click(async (event) => report_by_time('all')(event))
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
      //if (store.project && store.project.name === "ziyoumokuaiyouhua") {
      //el.src = `https://vkceyugu.cdn.bspapp.com/VKCEYUGU-3ca7fba5-3cfa-402c-aaec-2b3e431e262d/226c3600-5069-429d-95be-79bce56a1796.png`;
      //}
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
    let ico;
    if (number >= 1)
      ico = '🌕'
    else if (number >= 0.75)
      ico = '🌔'
    else if (number >= 0.5)
      ico = '🌓'
    else if (number > 0)
      ico = '🌒'
    else ico = '🌑'
    return ico + (Number(number) * 100).toFixed(2) + '%'
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
    const oneDayTime = 60 * 60 * 24 * 1000
    const monday = new Date(today.getTime() - (oneDayTime * (day - 1)))
    const nextMonday = new Date(today.getTime() + (oneDayTime * (8 - day)))
    if (monday.getTime() <= pastTime && nextMonday.getTime() > pastTime) {
      return true
    } else {
      return false
    }
  }

  /**
   * 史诗下所有事项（故事 + 子任务）
   * @param epicCode
   * @returns {Promise<unknown>}
   */
  function fetchEpicIssues(epicCode) {
    const url = `https://wydevops.coding.net/api/project/${store.project.id}/issues/epics/${epicCode}/issues`;
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

  /**
   * 事项详情
   * @param code
   * @returns {Promise<unknown>}
   */
  function fetchIssuesDetail(code) {
    const url = `https://wydevops.coding.net/api/project/${store.project.id}/issues/${code}?withDescriptionMarkup=false`;
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

  function report_by_time(type = 'week') {
    return async function (event) {
      event.target.innerText = '请稍后';
      event.target.disabled = 'disabled';
      const userId = event.target.dataset.user;
      console.log(event.target.dataset.user, store.story);
      let allSubTasks = [];
      store.story.forEach(item => {
        allSubTasks = [...allSubTasks, ...(item.subTasks.map(item1 => ({
          ...item1,
          epic: item.epic || {code: 0, name: '无史诗'},
          story: {code: item.code, name: item.name}
        })))]
      })
      console.log(allSubTasks);
      let processingTasks = allSubTasks.filter(item => item.assignee && (item.assignee.id == userId));
      if (type === 'week') processingTasks = processingTasks.filter(item => item.issueStatus.type !== 'TODO')
      const codes = processingTasks.map(item => item.code);
      const weekly_tasks = [];
      for (const code of codes) {
        const subTaskLogs = await subTaskDetail(code);
        const _logs = subTaskLogs.filter(item => item.issueLog.target === 'STATUS')
        const log = _logs[_logs.length - 1];

        if (type === 'week') {
          const time = new Date(log.createdAt)
          if (isCurrentWeek(time)) {
            weekly_tasks.push(processingTasks.find(item => item.code === code))
          }
        } else {
          weekly_tasks.push(processingTasks.find(item => item.code === code))
        }
      }
      const epicMap = {};
      weekly_tasks.forEach(item => {
        epicMap[item.epic.code] = epicMap[item.epic.code] || [];
        epicMap[item.epic.code].push(item)
      })
      const groupByEpic = Object.entries(epicMap).map(([epicCode, tasks]) => ({...tasks[0].epic, tasks}))
      console.log(groupByEpic)
      let text = ``;
      for (let index in groupByEpic) {
        const epic = groupByEpic[index];
        if (epic.code) {
          // 计算史诗进度 begin
          const epicIssues = await fetchEpicIssues(epic.code);
          const statData = {
            total: 0,
            curr: 0
          }
          for (const story of epicIssues) {
            const ownerTasks = story.subTasks.filter(task => task.issueTypeDetail.name === '子工作项' && task.assignee?.id == userId);
            console.log('ownerTasks:', ownerTasks)
            for (const task of ownerTasks) {
              const taskDetail = await fetchIssuesDetail(task.code);
              statData.total += taskDetail.workingHours;
              if (taskDetail.issueStatus.type === "COMPLETED") {
                statData.curr += taskDetail.workingHours;
              }
              console.log(taskDetail, statData.curr, statData.total)
            }
          }
          // 计算史诗进度 end
          text += `<b style="font-weight: bold;">${Number(index) + 1}、
<a href="https://wydevops.coding.net/p/${store.project.name}/epics/issues/${epic.code}/detail">史诗 ${epic.code}</a> ${epic.name}
 （${statData.curr} / ${statData.total}）${formatRate(statData.curr / statData.total)}</b>`
        } else
          text += `<b>${Number(index) + 1}、其他（无史诗）</b>`
        text += `<ul>`
        epic.tasks.forEach(task => {
          text += `<li>
                  <a href="https://wydevops.coding.net/p/${store.project.name}/requirements/issues/${task.story.code}/detail" title="${task.story.name}">故事 ${task.story.code}</a>
                   / <a href="https://wydevops.coding.net/p/${store.project.name}/requirements/issues/${task.story.code}/detail/subissues/${task.code}">任务 ${task.code}</a>
                  ：${task.name}（${task.workingHours}） <span style="color: red">—— ${task.issueStatus.name}</span>
                  </li>`
        });
        text += `</ul><br/>`;
      }
      event.target.innerText = type === 'week' ? '生成周报' : '生成迭代报告';
      event.target.removeAttribute('disabled')
      const MIMETYPE = "text/html";

      const data = [new ClipboardItem({[MIMETYPE]: new Blob([text], {type: MIMETYPE})})];
      navigator.clipboard.write(data).then(function () {
        alert("复制成功！去试试粘贴到Excel内吧～")
      }, function () {
        alert("不知道怎么回事，再试一次吧！")
        console.error("Unable to write to clipboard. :-(");
      });

    }
  }

  const FiberList = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40]

  function fiberMatch(number) {
    if (!number) return 0;
    const _number = number / 8;
    return FiberList.find(item => _number < item);
  }

  // 设置故事点
  async function setStoryPoint(story, point) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `https://wydevops.coding.net/api/project/${store.project.id}/issues/requirements/${story}/fields`,
        data: {storyPoint: point},
        type: "PATCH",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        dataType: "json",
        success: function ({data}) {
          console.log(data)
          resolve()
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          console.error(arguments)
          reject(errorThrown)
        }
      });
    })
  }
})();
