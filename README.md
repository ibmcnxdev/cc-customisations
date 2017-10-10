# Extensions:

## 1. Activity stream notifier - /as-notifier
Plugin to indicate whether there are new updates, and how many new updates are there, in the activity stream. Originally written for Connections on-prem, works for Connections Cloud without any changes. 

### What does it do?
1. Shows a button with 'X New Posts' at the top of the news feed (screenshot below)
2. Updates the page title, which lets you see if there are any updates without switching to the tab. (Also makes the tab glow if it is pinned - as seen on Facebook, Instagram, etc.)
3. Ignores any comments or likes created by the user themselves as new updates. 

### How?
The script first checks to see if it's in Homepage on load. Then it finds the RSS feed URL for the currently selected updates stream (Discover, I'm following, etc). It then periodically polls said RSS feed to retrieve any entries since the time the page was loaded. If it finds any new entries, it shows a bar-button at the top indicating the number of new updates and updates the document.title allowing you to see if there are any updates without having to switch to the tab. 


## 2. Activity Stream Infinite Scroll - /as-scroller
Infinite scrolling for the activity stream. That's it.


## Common files - /core
Contains common utils for checking if DOM is ready and adding CSS to the page. Used by both plugins.

## Bonus
Also works in Connections on-prem if files are included in the header.jsp
