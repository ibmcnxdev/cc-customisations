/**
* @author: Jay Agrawal
**/

'use strict';

(function(){
  //scope variables
  var originalTitle = document.title,
    xhrHookAdded = false,
    numStories = 0,
    startTimestamp, notifierBtn, checking, checkInterval, xhr, overrideTimestamp, filterClickEvent;
  
  //Config params for this customisation 
   window.ncConfig = {
    checkingInterval: 15000,
    singularLabel:' New Post',
    pluralLabel:' New Posts',
    maxNewPosts: 20,
    streamUpdatedDelay: 1500,
    domQueries:{
      selectedFilter:'[id^="com_ibm_social_as_filter_FilterList"] a.filterSelected',
      rssFeedLink:'div[id^="com_ibm_social_as_feed_FeedLink"] a',
      container: '.lotusStream .lotusWidgetBody .streamHeaderWrapper .icStream-search'
    },
    loginUrl:'/homepage/login'
  };

  //Registering with core utils module to call init() when required dom elements are is ready
  if(typeof ccUtils==='object') {
    ccUtils.loadWhenReady(init, [
      function(){
        return ibmConfig && ibmConfig.serviceName==='homepage' && window.location.pathname.indexOf('updates')>-1;
      },
      function(){
        var container = dojo.query(ncConfig.domQueries.container);
        if(container.length===1) return container[0];
      }
    ]);
  } else console.error('missing dependency - cc-utils.js');
  
  //Main controller function to create notifier button
  function init(container) {
    originalTitle = document.title;
    startTimestamp = overrideTimestamp || (new Date()).toISOString();
    overrideTimestamp = null;
    addDojoXhrHook();
    mapSelectedFilterEvent();
    if(container){
      if(notifierBtn) dojo.destroy(notifierBtn);
      notifierBtn = dojo.create('div',{className:'activity-stream-notify-area lotusHidden', innerHTML:''}, container,'after');
      dojo.connect(notifierBtn,'click',function(){
        var selectedFilter = dojo.query(ncConfig.domQueries.selectedFilter);
        if(selectedFilter && selectedFilter.length===1 && selectedFilter[0]) ccUtils.fireClickEvent(selectedFilter[0]);
        resetState(container);
      });
    }
    if(!checking){
      checking = true;
      checkInterval = setInterval(check, ncConfig.checkingInterval);
    }
  }
  
  //fn run preiodically to check if there are new stories
  function check() {
    getNumNewStories(function(numNewStories){
      if(numNewStories>0 && notifierBtn){
        numStories = numNewStories;
        dojo.removeClass(notifierBtn,'lotusHidden');
        var numLabel = (numNewStories > ncConfig.maxNewPosts ? ncConfig.maxNewPosts+'+' : numNewStories);
        notifierBtn.innerHTML = numLabel + (numNewStories>1 ? ncConfig.pluralLabel : ncConfig.singularLabel);
        document.title = '('+numLabel+')'+' '+originalTitle;
        if(numNewStories>ncConfig.maxNewPosts) {
          checking = false;
          clearInterval(checkInterval);
        }
      }
    });
  }
  
  //fn to get start time from rss feed data
  function getStartTime(done) {
    getEntries(function(data){
      var feedData = dojo.fromJson(data);
      done(feedData.list[0].published);
    },function(){done((new Date()).toISOString());});
  }
  
  //fn to extract num of new stories since startTimestamp from rss feed 
  function getNumNewStories(done) {
    getEntries(function(data){
      var feedData = dojo.fromJson(data);
      // if(feedData.list.length>0) console.log('found new entry with date', feedData.list[0].published);
      done(feedData.list.length);
    },function(){done(0);}, true);
  }
  
  //fn to get entries from rss feed
  function getEntries(load,error,newOnly) {
    if(xhr) xhr.cancel();
    xhr = dojo.xhrGet({
      url: getFeedUrl(newOnly),
      handleAs:'text',
      handle:function(response){
        xhr = null;
        if(response.status===401){
          console.log('Authentication timed out');
          window.location = ncConfig.loginUrl;
        }
      },
      load:load,
      error: function(err){
        if (err.dojoType==='cancel') { return; }
        console.error(err);
        error.apply(this,arguments);
      }
    });
  }
  
  //fn to extract rss feed url from DOM
  function getFeedUrl(newOnly) {
    var url;
    var feedLink = dojo.query(ncConfig.domQueries.rssFeedLink);
    if(feedLink && feedLink.length===1 && feedLink[0].href.indexOf('javascript')===-1) {
      url = feedLink[0].href+'&format=json'+(newOnly? '&updatedSince='+startTimestamp : '');
      url = url.replace(/\&format=atom/,'');
      // console.log('got url',url);
    }
    return url;
  }
  
  //Function to map click event on selected filter (Discover, I'm following, etc) to resetState
  function mapSelectedFilterEvent() {
    var selectedFilter = dojo.query(ncConfig.domQueries.selectedFilter);
    if(selectedFilter && selectedFilter.length===1 && selectedFilter[0]){
      if(filterClickEvent) dojo.disconnect(filterClickEvent);
      filterClickEvent = dojo.connect(selectedFilter[0], 'click', resetState);
    }
  }
  
  //xhr hook to prevent user's comments and likes from showing up as an update
  function dojoXhrHook(xhrType, args) {
    if(xhrType==='POST' && args && args.url.indexOf('connections/opensocial/')>-1){
      var callbackProp = args.load ? 'load' : args.handle ? 'handle' : null;
      if(callbackProp){
        var oldCallback = args[callbackProp];
        args[callbackProp] = function(){
          streamUpdated();
          return oldCallback.apply(this,arguments);
        };
      }
    }
  }
  
  //function to add xhr hook
  function addDojoXhrHook() {
    if(xhrHookAdded) return;
    xhrHookAdded = true;
    var oldXhr = dojo.xhr;
    dojo.xhr = function(){
      dojoXhrHook.apply(this,arguments);
      return oldXhr.apply(this, arguments);
    }
  }
  
  //reset state of container, called when selected filter or notifier button is clicked
  function resetState(container) {
    if(originalTitle) document.title = originalTitle;
    numStories = 0;
    init(container);
  }
  
  //fn called from xhr hook to notify 
  function streamUpdated() {
    if(numStories==0){
      setTimeout(function(){
        getStartTime(function(timestamp){ //get start time from the first entry to account for server-client time diff
          // console.log('streamUpdated newtimestamp',timestamp);
          if(timestamp) overrideTimestamp = timestamp;
          resetState();
        });
      }, ncConfig.streamUpdatedDelay);
    }
  }
})();
