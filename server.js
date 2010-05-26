(function(){
  var BASE_INTERVAL_SECONDS, get_new_dms, last_message_id, run_loop, send_dm, send_reminder, send_reminders, sys, track, tracked_dms, twitscript, twitter;
  var __hasProp = Object.prototype.hasOwnProperty;
  // Send a DM to this Twitter search reminder bot and it'll send you back http://search.twitter.com/?q=<first word of your message>
  // This is useful for reminding yourself to search for someone's @mentions the next day to see replies to a person's question, for example.
  // Do whatever you want with this code.
  // Credits: Hacked by @gabehollombe. Thanks to @joshprice and @jeremygrant for thoughts and a bit of pairing.
  //How often to check for new DMs and how long to wait before sending back a reminder DM
  BASE_INTERVAL_SECONDS = 60 * 60 * 24;
  //60 seconds * 60 minutes * 24 hours = 1 day
  sys = require('sys');
  twitscript = require('./vendor/twitscript/src/twitscript');
  twitter = new twitscript.init({
    username: "myusername",
    password: "mypassword",
    version: 1
  });
  last_message_id = null;
  tracked_dms = {};
  get_new_dms = function() {
    return twitter.getDirectMessages({
      since_id: last_message_id
    }, function(dms) {
      var _a, _b, _c, _d, dm;
      _a = []; _c = dms;
      for (_b = 0, _d = _c.length; _b < _d; _b++) {
        dm = _c[_b];
        _a.push(track(dm));
      }
      return _a;
    });
  };
  track = function(dm) {
    var id, text;
    if (parseInt(dm.id, 10) > last_message_id) {
      last_message_id = parseInt(dm.id, 10);
    }
    id = dm.id;
    tracked_dms[id] = dm;
    text = dm.text;
    return text;
    //send_dm(dm.sender_screen_name, "We'll watch $text")
  };
  send_dm = function(to, text) {
    return twitter.sendDirectMessage({
      user: to,
      text: text
    });
  };
  send_reminder = function(dm) {
    var query, text, user;
    query = dm.text;
    user = dm.sender_screen_name;
    text = ("http://search.twitter.com/search?q=" + query);
    send_dm(user, text);
    return delete tracked_dms[dm.id];
  };
  send_reminders = function() {
    var _a, _b, dm, id, its_time_to_send;
    _a = []; _b = tracked_dms;
    for (id in _b) { if (__hasProp.call(_b, id)) {
      dm = _b[id];
      _a.push((function() {
        //only send them a reminder if it's been more than BASE_INTERVAL_SECONDS seconds since we received their original dm
        its_time_to_send = Date.parse(dm.created_at).valueOf() + BASE_INTERVAL_SECONDS < new Date().valueOf();
        if (its_time_to_send) {
          return send_reminder(dm);
        }
      })());
    }}
    return _a;
  };
  run_loop = function() {
    get_new_dms();
    return send_reminders();
  };
  run_loop();
  setInterval(run_loop, 1000 * BASE_INTERVAL_SECONDS);
})();
