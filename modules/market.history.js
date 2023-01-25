module.exports.init = function () {
  console.log("market.history.js init called");
  $('app-history').addClass('patched');
  try {
    var userid = JSON.parse(localStorage.getItem("users.code.activeWorld"))[0]._id;
    module.exports.userId = userid;
  } catch (error) {
    console.error("Failed to get userId from localstorage", error);
    console.log("attempting to get userId from /api/auth/me");
    module.ajaxGet(window.location.origin + "/api/auth/me", function (data, error) {
      console.log(data, error);
      if (data) {
        module.exports.userId = data._id;
      } else {
        console.error("Failed to acquire userId", data || error);
        return;
      }
    });
  }

  console.log("Found userId", module.exports.userId);

  module.ajaxGet("https://screeps.com/api/user/rooms?id=" + userid, function (data, error) {
    module.exports.shards = {};
    if (data && data.shards) {
      console.log("Found shards", data.shards);
      for (const [shard, rooms] of Object.entries(data.shards)) {
        module.exports.shards[shard] = { rooms };
      }
    } else {
      console.error(data || error);
    }

    for (const [shardName, shard] of Object.entries(module.exports.shards)) {
      // return self.req('GET', 'https://screeps.com/api/game/world-size', { shard })
      console.log(`Fetching world size for ${shardName}`);
      module.ajaxGet("https://screeps.com/api/game/world-size?shard=" + shardName, function (worldSize, error) {
        console.log(`${JSON.stringify(worldSize)}`);
        shard.width = worldSize.width;
        shard.height = worldSize.height;
      });
    }

    // module.exports.update();
    // var element = document.getElementById(id);
    module.exports.page = 0;
    module.exports.fetchMarketHistoryPage(module.exports.page);

    //initially load another load of pages bit by bit
    if (module.exports.intervalHandlerInitial) {
      clearInterval(module.exports.intervalHandlerInitial);
    }
    module.exports.intervalHandlerInitial = setInterval(function () {
      if (module.exports.page >= 5) {
        clearInterval(module.exports.intervalHandlerInitial);
      } else {
        module.exports.fetchMarketHistoryPage(++module.exports.page);
      }
    }, 1000);

    //periodically get new data automatically
    if (module.exports.intervalHandlerAutoUpdate) {
      clearInterval(module.exports.intervalHandlerAutoUpdate);
    }
    module.exports.intervalHandlerAutoUpdate = setInterval(function () {
      module.exports.loadNewOrders();
    }, 60000 + Math.random() * 10000);


  });

  console.log("injecting styles");
  var style = document.createElement("style");
  style.innerHTML = ".mat-row:nth-of-type(2n+1) { background-color: rgba(255, 255, 255, 0.02); }";
  style.innerHTML +=
    ".loadButton {place-items: center;margin: 0 20px;border: none;background: transparent;color: #4A5FD2;font-size: 12px;font-weight: 600;line-height: 26px;text-transform: uppercase;}";
  style.innerHTML += "._success {color: #80D47B;}";
  style.innerHTML += "._fail {color: #D2554A;}";
  style.innerHTML += "._number {text-align:right;}";
  style.innerHTML +=
    ".type {display:inline-block; vertical-align: middle; width: 25px;min-height: 37px;text-align: center;background-repeat: no-repeat;}";

  document.head.appendChild(style);

  module.exports.players = {
    ["Invader"]: {
      userName: "Invader",
      userBadge: "https://screeps.com/api/user/badge-svg?username=Invader"
    }
  };

  var appHistory = document.getElementsByTagName("app-history")[0];
  // appHistory.innerHTML = ''
  module.exports.container = document.createElement("div");
  module.exports.container.style = "width: 100%; max-width:1100px; margin:auto;text-align:center;";
  // const todo = document.createElement("div");
  // todo.style = "text-align:left;color:white";
  // todo.innerHTML =
  // "<h1>TODO:</h1><ul><li>Fetch player names</li><li>Fetch player icon</li><li>date formatting</li><li>indicate if you are dealing on your own orders</li></ul>";
  // module.exports.container.appendChild(todo);

  module.exports.marketHistory = document.createElement("table");
  module.exports.marketHistory.style = "width: 100%;";

  module.exports.marketHistory.className = "app-market-table mat-table";

  $(module.exports.marketHistory).append('<tr><td><input class="filter-input" style="width:140px" placeholder="Date"></td><td><input class="filter-input" style="width:50px" placeholder="Shard"></td><td><input class="filter-input" style="width:60px" placeholder="Tick"></td><td><input class="filter-input" style="width:80px" placeholder="Credits"></td><td><input class="filter-input" style="width:80px" placeholder="Resource"></td><td><input class="filter-input" style="width:100%" placeholder="Description"></td></tr>');


  const header = document.createElement("tr");
  module.exports.marketHistory.appendChild(header);
  header.className = "mat-header-row ng-star-inserted";
  header.style = "position:stricky;";
  const dateHeaderCell = document.createElement("td");
  dateHeaderCell.innerHTML = "Date";
  dateHeaderCell.className = "mat-header-cell cdk-column-date mat-column-date ng-star-inserted";
  header.appendChild(dateHeaderCell);

  const shardHeaderCell = document.createElement("td");
  shardHeaderCell.innerHTML = "Shard";
  shardHeaderCell.className = "mat-header-cell cdk-column-shard mat-column-shard ng-star-inserted";
  header.appendChild(shardHeaderCell);

  const tickHeaderCell = document.createElement("td");
  tickHeaderCell.innerHTML = "Tick";
  tickHeaderCell.className = "_number mat-header-cell cdk-column-tick mat-column-tick ng-star-inserted";
  header.appendChild(tickHeaderCell);

  const changeHeaderCell = document.createElement("td");
  changeHeaderCell.innerHTML = "Credit Change";
  changeHeaderCell.className = "_number mat-header-cell cdk-column-change mat-column-change";
  header.appendChild(changeHeaderCell);

  const resourceHeaderCell = document.createElement("td");
  resourceHeaderCell.innerHTML = "Resource Change";
  resourceHeaderCell.className = "_number mat-header-cell cdk-column-change";
  header.appendChild(resourceHeaderCell);

  const descriptionHeaderCell = document.createElement("td");
  descriptionHeaderCell.innerHTML = "Description";
  descriptionHeaderCell.className = "mat-header-cell cdk-column-description mat-column-description ng-star-inserted";
  header.appendChild(descriptionHeaderCell);

  console.log("replacing  app history with new container");
  $(appHistory).html(module.exports.container);//.parentNode.replaceChild(module.exports.container, appHistory);

  module.exports.loadNewerButton = document.createElement("button");
  module.exports.loadNewerButton.className = "loadButton";
  module.exports.loadNewerButton.textContent = "Load new orders";
  module.exports.loadNewerButton.onclick = module.exports.loadNewOrders;

  module.exports.container.appendChild(module.exports.loadNewerButton);

  module.exports.container.appendChild(module.exports.marketHistory);

  module.exports.loadMoreButton = document.createElement("button");
  module.exports.loadMoreButton.className = "loadButton";
  module.exports.loadMoreButton.textContent = "Load more orders";
  module.exports.loadMoreButton.onclick = () => {
    // TODO: move focus to new orders
    module.exports.fetchMarketHistoryPage(++module.exports.page);
  };
  module.exports.container.appendChild(module.exports.loadMoreButton);

  // https://stackoverflow.com/questions/8939467/chrome-extension-to-read-http-response

  // https://stackoverflow.com/questions/18534771/chrome-extension-how-to-get-http-response-body
  // chrome.devtools.network.onRequestFinished.addListener(request => {
  //     request.getContent((body) => {
  //       if (request.request && request.request.url) {
  //         if (request.request.url.includes('api/user/money-history')) {

  //            //continue with custom code
  //            var bodyObj = JSON.parse(body);//etc.
  //            console.log(body);
  //         }
  // }
  // });
  // });

  module.exports.filterInputs = $('.filter-input');

  // Attach an event listener to each filter input
  module.exports.filterInputs.on('input', module.exports.filterHistory);


};

module.exports.checkPattern = function (pattern, text) {
  // Split pattern into an array of words
  const patternWords = pattern.split(" ");

  const textAsNumber = parseFloat(text);

  // Loop through each word in the pattern
  for (let i = 0; i < patternWords.length; i++) {
    let word = patternWords[i];
    // check if the word starts with > or <
    if (word.startsWith(">")) {
      // if starts with >, get the value after >
      let value = parseFloat(word.substring(1));
      // check if text length is more than the value
      if ((isNaN(textAsNumber) ? text : textAsNumber) <= value) {
        return false;
      }
    } else if (word.startsWith("<")) {
      // if starts with <, get the value after <
      let value = parseFloat(word.substring(1));
      // check if text length is less than the value
      if ((isNaN(textAsNumber) ? text : textAsNumber) >= value) {
        return false;
      }
    } else if (word.startsWith("!")) {
      // if starts with !, get the value after !
      let value = word.substring(1);
      // check if text does not include the value
      if (text.includes(value)) {
        return false;
      }
    } else {
      // if there is no >, < or !, check if the word is in the text
      if (!text.includes(word)) {
        return false;
      }
    }
  }
  // if all words are valid in the text, return true
  return true;
}


module.exports.filterHistory = function () {
  // Find all mat-row elements
  var matRows = $('.mat-table .mat-row');

  matRows.show();

  module.exports.filterInputs.each(function () {

    // Get the current filter input's value
    var filterValue = $(this).val().toLowerCase();
    //if blank then skip
    if (filterValue === '') {
      return;
    }

    // Find the index of the column of the current filter input
    var columnIndex = $(this).parent().index();


    // Loop through each mat-row element
    matRows.each(function () {
      var cell = $(this).find(".mat-cell").eq(columnIndex);
      var matCellText;
      if (columnIndex == 4) {
        var resource = $("[class^='type market-resource--']", cell);
        if (resource.length) {
          matCellText = resource.attr('class').substring(21).toLowerCase();
        } else {
          matCellText = 'N/A';
        }
      } else {
        matCellText = cell.text().toLowerCase();
      }

      // Check if the mat-cell text contains the filter value
      if (!module.exports.checkPattern(filterValue, matCellText)) {
        // Hide the mat-row element
        $(this).hide();
      }
    });

  });
}


module.exports.loadNewOrdersNextPage = function () {
  module.exports.fetchMarketHistoryPage(module.exports.loadNewOrdersPage++, true, () => {
    console.log('looking at more pages to try to reach something we have seen before');
    //we didnt hit any existing orders.. load some more in a bit

    if (module.exports.intervalHandlerLoadNewOrders) {
      clearTimeout(module.exports.intervalHandlerLoadNewOrders);
      module.exports.intervalHandlerLoadNewOrders = false;
    }

    if (module.exports.loadNewOrdersPage < 5) {
      //load the next page after a second up to 5 pages
      module.exports.intervalHandlerLoadNewOrders = setTimeout(module.exports.intervalHandlerLoadNewOrders, 1000);
    } else {
      console.log('giving up looking for most recent stuff.. too much gone on');
    }


  });
}

module.exports.loadNewOrders = function () {
  //handle an issue where you wait for so long that page 0..N actually contains new orders
  module.exports.loadNewOrdersPage = 0;
  module.exports.loadNewOrdersNextPage();
};


module.exports.fetchPlayer = function (id, history) {
  module.ajaxGet("https://screeps.com/api/user/find?id=" + id, function (data, error) {
    /*
      {
        "ok": 1,
        "user": {
            "_id": "58519b0bee6ae29347627228",
            "username": "Geir1983",
            "badge": {
                "type": 13,
                "color1": "#0066ff",
                "color2": "#0066ff",
                "color3": "#2b2b2b",
                "param": -22,
                "flip": true
            },
            "gcl": 26007686581,
            "power": 705273606
        }
      }
    */

    if (data.ok) {
      module.exports.players[id] = {
        userName: data.user.username,
        userBadge: "https://screeps.com/api/user/badge-svg?username=" + data.user.username
      };
    }

    if (
      history.market &&
      history.market.dealer &&
      ((history.market.owner && module.exports.players[history.market.owner]) || history.market.npc) &&
      module.exports.players[history.market.dealer]
    ) {
      module.exports.insertRow(history);
      module.exports.sortTable();
      module.exports.filterHistory();
    }
  });
};

module.exports.sortTable = function () {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = module.exports.marketHistory;
  switching = true;
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for (i = 1; i < rows.length - 1; i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      x = rows[i].getElementsByTagName("TD")[2];
      y = rows[i + 1].getElementsByTagName("TD")[2];
      // Check if the two rows should switch place:
      if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
        // If so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
};

module.exports.fetchMarketHistoryPage = function (page, loadingFromTop = false, callbackOnNoDuplicate = undefined) {
  console.log(`Fetching page ${page}`);
  module.ajaxGet("https://screeps.com/api/user/money-history?page=" + page, function (data, error) {
    /**
     * data
     *  ok: number // 1 for success
     *  hasMore: bool // has more pages
     *  list: [
     *      balance: number
     *      change: number
     *      date: date // "2021-07-18T06:13:50.016Z"
     *      market: {
     *      'market.sell' = {amount, dealer, npc, owner, price, resourceType, roomName, targetRoomName }
     *           'market.fee' = {order: {price, resourceType,roomName,totalAmoount,type}}
     *      }
     *      shard: string
     *      tick: number
     *      type: string | 'market.fee' | 'market.sell'
     *      user: string // userId
     *      _id: string // id of transaction
     *  ]
     *
     */
    if (!data || error || typeof data != 'object') {
      console.log('Error getting page', error, typeof data);
      return;
    }

    // console.log(data)
    if (!data.hasMore) {
      module.exports.loadMoreButton.disabled = true;
    }

    var skipped = false;

    for (const history of data.list) {
      let missingPlayer = false;
      if (history.market && history.market.dealer && !module.exports.players[history.market.dealer]) {
        module.exports.fetchPlayer(history.market.dealer, history);
        missingPlayer = true;
      }

      if (history.market && history.market.owner && !module.exports.players[history.market.owner]) {
        module.exports.fetchPlayer(history.market.owner, history);
        missingPlayer = true;
      }

      if (!missingPlayer) {
        if (!module.exports.insertRow(history) && loadingFromTop) {
          console.log('skipping the rest');
          skipped = true;
          break; //got to a dupe
        }
      }
    }
    module.exports.sortTable();

    if (loadingFromTop && !skipped && callbackOnNoDuplicate && typeof callbackOnNoDuplicate == 'function') {
      callbackOnNoDuplicate();
    }

    module.exports.filterHistory();

    // module.exports.update();
  });
};

module.exports.insertRow = function (history) {
  if (document.getElementById(history._id)) {
    console.log(history._id, "found skipping");
    return false;
  }

  const row = module.exports.generateHistoryHtmlRow(history);
  module.exports.marketHistory.appendChild(row);
  return true;
};

module.exports.generateHistoryHtmlRow = function (history) {
  // console.log(history);
  const row = document.createElement("tr");
  row.id = history._id;
  row.className = "mat-row ng-star-inserted";
  row.style = "height:auto";

  const dateCell = document.createElement("td");
  dateCell.className = "mat-cell cdk-column-date mat-column-date ng-star-inserted";
  // childs with _date and _time classes
  row.appendChild(dateCell);

  const shardCell = document.createElement("td");
  shardCell.className = "mat-cell cdk-column-shard mat-column-shard ng-star-inserted";
  row.appendChild(shardCell);

  const tickCell = document.createElement("td");
  tickCell.className = "_number mat-cell cdk-column-tick mat-column-tick ng-star-inserted";
  row.appendChild(tickCell);

  const changeCell = document.createElement("td");
  changeCell.className = `_number mat-cell cdk-column-change mat-column-change ${history.change > 0 ? "_success" : "_fail"
    }`;
  row.appendChild(changeCell);
  changeCell.innerHTML = '<span style="display:none">' + history.change + ' </span>' +
    module.exports.nFormatter(history.change) +
    '<div style="margin-right:0px !important" class="type resource-credits"></div>';

  const resourceCell = document.createElement("td");
  resourceCell.className = `_number mat-cell cdk-column-change mat-column-change ${history.type == "market.buy" ? "_success" : "_fail"
    }`;
  row.appendChild(resourceCell);

  const descriptionCell = document.createElement("td");
  descriptionCell.className = "mat-cell cdk-column-description mat-column-description ng-star-inserted";
  descriptionCell.style = "text-align:right;";
  row.appendChild(descriptionCell);

  const date = new Date(history.date);
  dateCell.innerHTML = `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getFullYear() + 1} ${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  shardCell.innerHTML = history.shard;
  tickCell.innerHTML = history.tick;

  var shard = history.shard || "shard0";

  try {
    if (history.type == "market.fee") {
      /*
       "market": {
          "changeOrderPrice": {
            "orderId": "6172d9cc8a185129c593b3af",
            "oldPrice": 34.751,
            "newPrice": 34.801
          }
        },
       */
      if (history.market.extendOrder) {
        var market = history.market.extendOrder;
        var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(market) + "'></div>";

        descriptionCell.innerHTML = `Extend ${module.exports.nFormatter(market.addAmount)} ${infoCircle}`;
      } else if (history.market.changeOrderPrice) {
        var market = history.market.changeOrderPrice;
        var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(market) + "'></div>";
        var priceChange = Math.abs(market.newPrice - market.oldPrice);
        var priceDigits = priceChange < 0.01 ? 3 : 2;

        descriptionCell.innerHTML = `Change Price ${module.exports.nFormatter(
          market.oldPrice,
          priceDigits
        )} -> ${module.exports.nFormatter(market.newPrice, priceDigits)} ${infoCircle}`;
      } else {
        var market = history.market.order;
        var type = market.resourceType;
        var roomName = market.roomName;
        var roomLink = `<a href="#!/room/${shard}/${roomName}">${roomName}</a>`;
        var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(market) + "'></div>";
        var resourceIcon = module.exports.resourceImageLink(shard, type);
        resourceCell.innerHTML = resourceIcon;

        const amount = market.remainingAmount
          ? `${module.exports.nFormatter(market.remainingAmount)} remaining`
          : `${module.exports.nFormatter(market.totalAmount)} total`;

        descriptionCell.innerHTML = `${roomLink} Market fee (${market.type
          }) ${amount} ${resourceIcon} (${module.exports.nFormatter(market.price)}) ${infoCircle}`;
      }
    } else if (history.type == "market.buy" || history.type == "market.sell") {
      var market = history.market;
      var type = market.resourceType;
      var roomName = market.roomName;
      var targetRoomName = market.targetRoomName;
      var accountResource = !roomName || !targetRoomName;
      var transactionCost = accountResource
        ? ""
        : module.exports.calcTransactionCost(shard, market.amount, roomName, targetRoomName);

      var ownerIsMe = market.owner == module.exports.userId;
      var dealerIsMe = market.dealer == module.exports.userId;

      var targetRoomIsMine = false;

      // market-resource--battery has -10px important margin, we need to override that
      var resourceIcon = module.exports.resourceImageLink(shard, type);

      var resourceEnergy = module.exports.resourceImageLink(shard, "energy");

      if (module.exports.shards[shard] && module.exports.shards[shard].rooms.includes(targetRoomName)) {
        let temp = roomName;
        roomName = targetRoomName;
        targetRoomName = temp;
        targetRoomIsMine = true;
      }

      var roomLink = `<a href="#!/room/${shard}/${roomName}">${roomName}</a>`;
      var targetRoomLink = `<a href="#!/room/${shard}/${targetRoomName}">${targetRoomName}</a>`;
      var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(market) + "'></div>";
      var transactionCostHtml = `(<span style="color:#ff8f8f;margin-right:-12px">-${module.exports.nFormatter(
        transactionCost
      )} ${resourceEnergy}</span>)`;

      const amount = module.exports.nFormatter(market.amount);
      var priceDigits = market.price < 0.01 ? 3 : 2;
      const price = module.exports.nFormatter(market.price, priceDigits);

      resourceCell.innerHTML = (history.type == "market.sell" ? "-" : "") + amount + resourceIcon;

      const soldOrBought = history.type == "market.buy" ? "bought" : "sold";

      if (history.market && history.market.dealer && !module.exports.players[history.market.dealer]) {
        module.exports.fetchPlayer(history.market.dealer);
      }

      const orderOwner = history.market.npc ? "Invader" : market.owner;

      const ownerPlayerName = module.exports.players[orderOwner] ? module.exports.players[orderOwner].userName : "";
      const ownerPlayerIcon = module.exports.players[orderOwner]
        ? module.exports.playerBadge(ownerPlayerName, module.exports.players[orderOwner].userBadge)
        : "";

      const dealerPlayerName = module.exports.players[market.dealer]
        ? module.exports.players[market.dealer].userName
        : "";
      const dealerPlayerIcon = module.exports.players[market.dealer]
        ? module.exports.playerBadge(dealerPlayerName, module.exports.players[market.dealer].userBadge)
        : "";

      if (accountResource) {
        descriptionCell.innerHTML = `Account: ${soldOrBought} ${amount}${resourceIcon} (${price}) ${infoCircle}`;
      } else if (dealerIsMe) {
        descriptionCell.innerHTML = `${ownerPlayerIcon} at ${targetRoomLink} ${amount}${resourceIcon} (${price}) Dealer ${dealerPlayerIcon} ${soldOrBought} from ${roomLink} ${transactionCostHtml} ${infoCircle}`;
      } else {
        descriptionCell.innerHTML = `${ownerPlayerIcon} at ${roomLink} ${soldOrBought} ${amount}${resourceIcon} (${price}) Dealer ${dealerPlayerIcon} at ${targetRoomLink} ${infoCircle}`;
      }
    }
  } catch (error) {
    var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(history) + "'></div>";
    console.error(error);
    descriptionCell.innerHTML = `Error: ${error.message} ${infoCircle}`;
  }
  return row;
};
module.exports.resourceImageLink = function (shard, type) {
  // market-resource--battery has -10px important margin, we need to override that
  return type
    ? `<a href="#!/market/all/${shard}/${type}" title="${type}">
                    <div style=\"margin-right:0px !important\" class=\"type market-resource--${type}\"></div>
                  </a>`
    : "";
};

module.exports.playerBadge = function (playerName, badge) {
  return `<app-badge title="${playerName}" >
            <a href="#!/profile/${playerName}">
              <img src=${badge} width="16" height="16">
            </a>
          </app-badge>`;
};

module.exports.update = function () {
  console.log("update getting called");

  if ($('app-history').length && !$('app-history').hasClass('patched')) {
    console.log("patch it!");
    module.exports.init();
  }
};

module.exports.nFormatter = function (num, digits = 2) {
  let convertFromNegative = 1;
  if (num < 0) {
    convertFromNegative = -1;
    num *= convertFromNegative;
  }
  let si = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  const formatted = (num / si[i].value).toFixed(digits).replace(rx, "$1") * convertFromNegative;
  return formatted + si[i].symbol;
};

/* taken from @screeps market */
module.exports.calcTransactionCost = function (shard, amount, roomName1, roomName2) {
  var distance = module.exports.calcRoomsDistance(shard, roomName1, roomName2, true);

  // TODO: export distance to render in table
  console.log(`${shard} amount: ${amount} roomName1: ${roomName1} roomName2: ${roomName2} distance: ${distance}`);
  return Math.ceil(amount * (1 - Math.exp(-distance / 30)));
};

/* taken from @screeps utils */
module.exports.calcRoomsDistance = function (shard, room1, room2, continuous) {
  var _exports$roomNameToXY = module.exports.roomNameToXY(room1);

  var _exports$roomNameToXY2 = module.exports._slicedToArray(_exports$roomNameToXY, 2);

  var x1 = _exports$roomNameToXY2[0];
  var y1 = _exports$roomNameToXY2[1];

  var _exports$roomNameToXY3 = module.exports.roomNameToXY(room2);

  var _exports$roomNameToXY4 = module.exports._slicedToArray(_exports$roomNameToXY3, 2);

  var x2 = _exports$roomNameToXY4[0];
  var y2 = _exports$roomNameToXY4[1];

  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);
  if (continuous) {
    // WORLD_WIDTH and WORLD_HEIGHT constants are deprecated, please use Game.map.getWorldSize() instead
    // const WORLD_WIDTH = 202;
    // const WORLD_HEIGHT = 202;
    // var width = WORLD_WIDTH;
    // var height = WORLD_HEIGHT;
    var { width, height } = module.exports.shards[shard];

    dx = Math.min(width - dx, dx);
    dy = Math.min(height - dy, dy);
  }
  return Math.max(dx, dy);
};

/* taken from @screeps utils */
module.exports.roomNameToXY = function (name) {
  name = name.toUpperCase();

  var match = name.match(/^(\w)(\d+)(\w)(\d+)$/);
  if (!match) {
    return [undefined, undefined];
  }

  var _match = module.exports._slicedToArray(match, 5);

  var hor = _match[1];
  var x = _match[2];
  var ver = _match[3];
  var y = _match[4];

  if (hor == "W") {
    x = -x - 1;
  } else {
    x = +x;
  }
  if (ver == "N") {
    y = -y - 1;
  } else {
    y = +y;
  }
  return [x, y];
};

/* taken from @screeps utils */
module.exports._slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;
    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
})();
