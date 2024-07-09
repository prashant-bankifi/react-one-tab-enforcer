"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withOneTabEnforcer = withOneTabEnforcer;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var cardStyle = {
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "20px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  maxWidth: "90%" // textAlign: 'center',
};
var titleStyle = {
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "10px"
};
var subheadingStyle = {
  fontSize: "18px",
  color: "#555"
};
var containerStyle = {
  height: "100vh",
  margin: 0,
  fontFamily: "Arial, sans-serif",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

var DefaultOnlyOneTabComponent = function DefaultOnlyOneTabComponent(props) {
  return _react.default.createElement(
    "div",
    {
      style: containerStyle
    },
    _react.default.createElement(
      "div",
      {
        style: cardStyle
      },
      _react.default.createElement(
        "div",
        {
          style: titleStyle
        },
        props.appName ? props.appName : "OCM Application"
      ),
      _react.default.createElement(
        "div",
        {
          style: subheadingStyle
        },
        "Sorry! You can only have this application opened in one tab"
      )
    )
  );
}; // eslint-disable-next-line import/prefer-default-export

function withOneTabEnforcer() {
  var _ref =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
    _ref$OnlyOneTabCompon = _ref.OnlyOneTabComponent,
    OnlyOneTabComponent =
      _ref$OnlyOneTabCompon === void 0
        ? DefaultOnlyOneTabComponent
        : _ref$OnlyOneTabCompon,
    _ref$localStorageTime = _ref.localStorageTimeout,
    localStorageTimeout =
      _ref$localStorageTime === void 0 ? 15 * 1000 : _ref$localStorageTime,
    _ref$localStorageRese = _ref.localStorageResetInterval,
    localStorageResetInterval =
      _ref$localStorageRese === void 0 ? 10 * 1000 : _ref$localStorageRese,
    _ref$appName = _ref.appName,
    appName = _ref$appName === void 0 ? "default-app-name" : _ref$appName;

  return function(WrappedComponent) {
    // ...and returns another component...
    return function(props) {
      if (
        isDuplicatedWindow(
          localStorageTimeout,
          localStorageResetInterval,
          appName
        )
      ) {
        return _react.default.createElement(OnlyOneTabComponent, {
          appName: appName
        });
      } else {
        return _react.default.createElement(WrappedComponent, props);
      }
    };
  };
}

var isDuplicatedWindow = function isDuplicatedWindow(
  localStorageTimeout,
  localStorageResetInterval,
  localStorageTabKey
) {
  var ItemType = {
    Session: 1,
    Local: 2
  };

  function setCookie(name, value, days) {
    var expires = "";

    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }

    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");

    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];

      while (c.charAt(0) == " ") {
        c = c.substring(1, c.length);
      }

      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }

    return null;
  }

  function GetItem(itemtype) {
    var val = "";

    switch (itemtype) {
      case ItemType.Session:
        val = window.name;
        break;

      case ItemType.Local:
        val = decodeURIComponent(getCookie(localStorageTabKey));
        if (val == undefined) val = "";
        break;
    }

    return val;
  }

  function SetItem(itemtype, val) {
    switch (itemtype) {
      case ItemType.Session:
        window.name = val;
        break;

      case ItemType.Local:
        setCookie(localStorageTabKey, val);
        break;
    }
  }

  function createGUID() {
    var s4 = function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    };

    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }
  /**
   * Compare our tab identifier associated with this session (particular tab)
   * with that of one that is in window name Storage (the active one for this browser).
   * This browser tab is good if any of the following are true:
   * 1.  There is no cookie Storage Guid yet (first browser tab).
   * 2.  The window name Storage Guid matches the cookie Guid.  Same tab, refreshed.
   * 3.  The window name Storage timeout period has ended.
   *
   * If our current session is the correct active one, an interval will continue
   * to re-insert the window name Storage value with an updated timestamp.
   *
   * Another thing, that should be done (so you can open a tab within 15 seconds of closing it) would be to do the following (or hook onto an existing onunload method):
   */

  function isTabDuplicated() {
    //console.log("In testTab");
    var sessionGuid = GetItem(ItemType.Session) || createGUID();
    SetItem(ItemType.Session, sessionGuid);
    var val = GetItem(ItemType.Local);
    var tabObj = (val == "" ? null : JSON.parse(val)) || null; // If no or stale tab object, our session is the winner.  If the guid matches, ours is still the winner

    if (
      tabObj === null ||
      tabObj.timestamp < new Date().getTime() - localStorageTimeout ||
      tabObj.guid === sessionGuid
    ) {
      var setTabObj = function setTabObj() {
        //console.log("In setTabObj");
        var newTabObj = {
          guid: sessionGuid,
          timestamp: new Date().getTime()
        };
        SetItem(ItemType.Local, JSON.stringify(newTabObj));
      };

      setTabObj();
      setInterval(setTabObj, localStorageResetInterval); //every x interval refresh timestamp in cookie

      window.onunload = function() {
        SetItem(ItemType.Local, "");
        localStorage.removeItem(localStorageTabKey);
      };

      return false;
    } else {
      // An active tab is already open that does not match our session guid.
      return true;
    }
  }

  return isTabDuplicated();
};
//# sourceMappingURL=index.js.map
