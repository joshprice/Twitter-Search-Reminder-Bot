# Send a DM to this Twitter search reminder bot and it'll send you back http://search.twitter.com/?q=<first word of your message>
# This is useful for reminding yourself to search for someone's @mentions the next day to see replies to a person's question, for example.

# Do whatever you want with this code.
# Credits: Hacked by @gabehollombe. Thanks to @joshprice and @jeremygrant for thoughts and a bit of pairing.

#How often to check for new DMs and how long to wait before sending back a reminder DM
BASE_INTERVAL_SECONDS: 60 * 60 * 24 #60 seconds * 60 minutes * 24 hours = 1 day

sys: require 'sys'
twitscript: require './vendor/twitscript/src/twitscript'

twitter: new twitscript.init({
    username: "myusername",
    password: "mypassword",
    version: 1
});

last_message_id: null
tracked_dms: {}

get_new_dms: ->
  twitter.getDirectMessages(
    {since_id: last_message_id}, 
    (dms) -> 
      track(dm) for dm in dms
  )

track: (dm) ->
  last_message_id: parseInt(dm.id, 10) if parseInt(dm.id, 10) > last_message_id
  id: dm.id
  tracked_dms[id] = dm
  text: dm.text
  #send_dm(dm.sender_screen_name, "We'll watch $text")

send_dm: (to, text) ->
  twitter.sendDirectMessage(
    { user: to
      text: text })

send_reminder: (dm) ->
  query: dm.text
  user: dm.sender_screen_name
  text: "http://search.twitter.com/search?q=$query"
  send_dm(user, text)
  delete tracked_dms[dm.id]

send_reminders: ->
  for id,dm of tracked_dms
    #only send them a reminder if it's been more than BASE_INTERVAL_SECONDS seconds since we received their original dm
    its_time_to_send: Date.parse(dm.created_at).valueOf() + BASE_INTERVAL_SECONDS < new Date().valueOf()
    send_reminder(dm) if its_time_to_send

run_loop: ->
  get_new_dms()
  send_reminders()

run_loop()
setInterval(run_loop, 1000 * BASE_INTERVAL_SECONDS)
