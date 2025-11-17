What does Reddit Scraper do?
Our unofficial Reddit API will get data from Reddit with no limitations or authentication. It enables you to extract posts and comments together with some user info without login. It is built on top of Apify SDK, and you can run it both on the Apify platform.

Reddit Scraper allows you to:

scrape subreddits (communities) with top posts
scrape Reddit posts with title and text, username, number of comments, votes, media elements.
get Reddit comments, timestamps, points, usernames, post and comment URLs.
scrape user details, their most recent posts and comments.
sort scraped data by categories of Relevance, Hot, Top, and New.
scrape data using a specific URL or by keyword.
What data can I extract from Reddit?
📌 Popular subreddits 🔍 Subreddit details
📋 Subreddit name 👥 Number of members
🌐 Community URL 📚 Category
📌 Reddit posts 💬 Reddit comments
📃 Title and text ⏱ Timestamps
👤 Username 🔗 Post and comment URLs
👍 Votes 📷 Media elements
👤 User details 📄 Recent posts and comments
How much will it cost to scrape Reddit?
Reddit Scraper on the Apify platform will give you 1,000 results for less than $4 in platform usage credits. That should be covered by the free $5 in monthly credits you get on every Apify Free plan.

But if you need to get more data regularly from Reddit, you should grab an Apify subscription. We recommend our $49/month Starter plan - with that one, you can get well over 10,000 results every month! Watch this video for a few helpful tips on how to pick a plan.

How to scrape Reddit?
Reddit Scraper doesn't require any coding skills to start using it.

Create a free Apify account using your email.
Open the Reddit Scraper.
Add one or more subreddits, users or post URLs to scrape their information.
Click "Start" and wait for the scraper to extract the data.
Download your data in JSON, XML, CSV, Excel, or HTML format.
If you're unsure where to start, just follow our step-by-step guide or see our short video tutorial. The tutorial steps can be also be used for Reddit Scraper Lite.

How to use scraped Reddit data
Keep track of discussions about your brand or product across Reddit communities.
Research the topics that interest you and get a wide range of opinions.
Keep an eye on debates over high stakes subjects such as finance, politics, new technology, and news in general.
Watch out for new trends, attitudes, and PR opportunities.
Automatically track mentions of the business or topic that interests you.
Scrape Reddit comments to kick off and support your sentiment analysis.
Input parameters
If this Actor is run on the Apify platform, there are two ways you can scrape Reddit:

by Start URLs field - this will get you all details from any Reddit URL, no matter whether it's a post, a user, or a community.
or by Search Term field - this will scrape all data from Reddit in Communities, Posts, and People for a specific keyword.
How to scrape Reddit by URLs
Almost any URL from Reddit will return a dataset. If the URL is not supported, the scraper will display a message before scraping the page.

Input examples
Here are some examples of URLs that can be scraped.

scraping communities: https://www.reddit.com/r/worldnews/

scraping channels within communities: https://www.reddit.com/r/worldnews/hot

scraping popular communities: https://www.reddit.com/subreddits/leaderboard/crypto/

scraping users: https://www.reddit.com/user/lukaskrivka

scraping user comments: https://www.reddit.com/user/lukaskrivka/comments/

scraping posts: https://www.reddit.com/r/learnprogramming/comments/lp1hi4/is_webscraping_a_good_skill_to_learn_as_a_beginner/

scraping popular posts: https://www.reddit.com/r/popular/

scraping search results:

for users/communities: https://www.reddit.com/search/?q=news&type=sr%2Cuser

for posts: https://www.reddit.com/search/?q=news

Note: if you use a search URL as a parameter for startUrls, it will only scrape for posts. If you want to search for communities and users, use the search field or a specific URL instead.

How to scrape Reddit by search term
Search Term or searches - the keywords you want to search via the Reddit's search engine. You can keep one field or add as many as you want. Don't use this field if you're using the startUrls parameter.

Search type or type - indicates which part of Reddit you're scraping: "Posts" or "Communities and users".

Sort search or sort - will sort search results by Relevance, Hot, Top, New or most amount of Comments.

Filter by date or time - will filter the search by the last hour, day, week, month or year. Only available if you're scraping Posts.

To see the full list of parameters, their default values, and how to set the values of your own, head over to Input Schema tab.

Input example
This is an example of how your input will look like if you decide to scrape all Reddit communities that contain the keyword parrot. Results will be sorted by the newest first.

{
"maxItems": 10,
"maxPostCount": 10,
"maxComments": 10,
"maxCommunitiesCount": 10,
"maxUserCount": 10,
"maxLeaderBoardItems": 10,
"scrollTimeout": 40,
"proxy": {
"useApifyProxy": true
},
"searches": ["parrots"],
"type": "community",
"sort": "new",
"time": "all"
}

Results
The output from scraping Reddit is stored in the dataset. Each post, comment, user or community is stored as an item inside the dataset. After the run is finished, you can download the scraped data onto your computer or export to any web app in various data formats (JSON, CSV, XML, RSS, HTML Table). Here's a few examples of the outputs you can get for different types of inputs:

📝 Example Reddit post
{
"id": "t3_144w7sn",
"parsedId": "144w7sn",
"url": "https://www.reddit.com/r/HonkaiStarRail/comments/144w7sn/my_luckiest_10x_pull_yet/",
"username": "YourKingLives",
"title": "My Luckiest 10x Pull Yet",
"communityName": "r/HonkaiStarRail",
"parsedCommunityName": "HonkaiStarRail",
"body": "URL: https://i.redd.it/yod3okjkgx4b1.jpg\nThumbnail: https://b.thumbs.redditmedia.com/lm9KxS4laQWgx4uOoioM3N7-tBK3GLPrxb9da2hGtjs.jpg\nImages:\n\thttps://preview.redd.it/yod3okjkgx4b1.jpg?auto=webp&amp;v=enabled&amp;s=be5faf0250e19138b82c7bbe5e7406fa46da4e73\n",
"html": null,
"numberOfComments": 0,
"upVotes": 1,
"isVideo": false,
"isAd": false,
"over18": false,
"createdAt": "2023-06-09T05:23:15.000Z",
"scrapedAt": "2023-06-09T05:23:28.409Z",
"dataType": "post"
},

💬 Example Reddit comment
{
"id": "t1_jnhqrgg",
"parsedId": "jnhqrgg",
"url": "https://www.reddit.com/r/NewsWithJingjing/comments/144v5c3/theres_no_flag_large_enough/jnhqrgg/",
"parentId": "t3_144v5c3",
"username": "smokecat20",
"category": "NewsWithJingjing",
"communityName": "r/NewsWithJingjing",
"body": "A true patriot.",
"createdAt": "2023-06-09T05:00:00.000Z",
"scrapedAt": "2023-06-09T05:23:32.025Z",
"upVotes": 3,
"numberOfreplies": 0,
"html": "&lt;div class=\"md\"&gt;&lt;p&gt;A true patriot.&lt;/p&gt;\n&lt;/div&gt;",
"dataType": "comment"
}

👥 Example Reddit community
{
"id": "2qlhq",
"name": "t5_2qlhq",
"title": "Pizza",
"headerImage": "https://b.thumbs.redditmedia.com/jq9ytPEOecwd5bmGIvNQzjTPE9hdd0kB9XGa--wq55A.png",
"description": "The home of pizza on reddit. An educational community devoted to the art of pizza making.",
"over18": false,
"createdAt": "2008-08-26T00:03:48.000Z",
"scrapedAt": "2023-06-09T05:16:55.443Z",
"numberOfMembers": 569724,
"url": "https://www.reddit.com/r/Pizza/",
"dataType": "community"
}

👤 Example Reddit user
{
"id": "c3h2qmv",
"url": "https://www.reddit.com/user/jancurn/",
"username": "jancurn",
"userIcon": "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_7.png",
"postKarma": 4,
"commentKarma": 10,
"description": "",
"over18": false,
"createdAt": "2018-09-10T15:13:39.000Z",
"scrapedAt": "2023-06-09T05:21:14.409Z",
"dataType": "user"
}

Only need a few Reddit results?
Use our super fast dedicated Reddit Scraper Lite if you want to scrape Reddit data on a smaller scale. Just enter one or more Reddit URLs or keywords and click to scrape.

Notes for developers
Limiting results with maxItems
If you need to limit the scope of your search, you can do that by setting the max number of posts you want to scrape inside a community or user. You can also set a limit to the number of comments for each post. You can limit the number of communities and the number of leaderboards by using the following parameters:

{
"maxItems": 100,
"maxPostCount": 50,
"maxComments": 10,
"maxCommunitiesCount": 5,
"maxUserCount": 5,
"maxLeaderBoardsItems": 5
}

You can also set maxItems to prevent a very long run of the Actor. This parameter will stop your scraper when it reaches the number of results you've indicated, so you need to be careful not to trim your results.

See the Input Schema tab for the full list of the ways to restrict Reddit Scraper using these parameters: maxItems, maxPostCount, maxComments, maxCommunitiesCount, maxLeaderBoardItems

Extend output function
You can use this function to update the result output of this Actor. You can choose what data from the page you want to scrape. The output from this function will get merged with the result output.

The return value of this function has to be an object!

You can return fields to achieve 3 different things:

Add a new field - Return object with a field that is not in the result output
Change a field - Return an existing field with a new value
Remove a field - Return an existing field with a value undefined
async () => {
return {
pageTitle: document.querySelector('title').innerText,
};
};

This example will add the title of the page to the final object:

{
"id": "2qlhq",
"name": "t5_2qlhq",
"title": "Pizza",
"headerImage": "https://b.thumbs.redditmedia.com/jq9ytPEOecwd5bmGIvNQzjTPE9hdd0kB9XGa--wq55A.png",
"description": "The home of pizza on reddit. An educational community devoted to the art of pizza making.",
"over18": false,
"createdAt": "2008-08-26T00:03:48.000Z",
"scrapedAt": "2023-06-09T05:16:55.443Z",
"numberOfMembers": 569724,
"url": "https://www.reddit.com/r/Pizza/",
"dataType": "community"
"pageTitle": "homemade chicken cheese masala pasta"
}

FAQ
Is Reddit scraping legal?
While scraping publicly available data from Reddit is generally allowed, it's important to comply with Reddit's terms of service and respect the site's usage policies. It's recommended to use the scraper responsibly, avoid excessive requests, and ensure that the scraped data is used in compliance with applicable laws and regulations. You can read more about compliance with ToS in our blogpost.

Can I use Reddit API to scrape Reddit?
The Reddit API is currently free. However, Reddit has specific API rules, and free access to the API will be restricted in the future due to concerns over data usage. In addition, Reddit API has been recently announced to become a paid service. Using a Reddit web scraper such as this one as an API has advantages such over the official one such as not requiring authentication, special authorization for commercial use, or registration for a token.

How can I scrape Reddit comments?
Reddit Scraper allows scraping specific parts of Reddit, including comments. You can extract posts and comments along with user information, such as timestamps, number of votes, usernames, post URL, and comment URLs. This enables you to gather comprehensive commment data from subreddits and Reddit users.

Is it necessary to use cookies for accessing logged-in content when scraping Reddit?
No, it is not required. As of May 2023, Reddit maintains its data publicly accessible and does not enforce a login barrier.

Do you need proxies for scraping Reddit?
It is highly recommended. Subreddits are open for access and do not require a login to retrieve information. Typically, using proxies is necessary to ensure successful Reddit scraping. While some results can be obtained with datacenter proxies, residential proxies are preferred for Reddit scraping. Fortunately, our Free plan offers a trial of Apify Proxy, which get you started.

Can I export or import scraped Reddit data using API?
Yes. The Apify API gives you programmatic access to the Apify platform. The API is organized around RESTful HTTP endpoints that enable you to manage, schedule, and run any Apify Actor, including this one. The API also lets you access any datasets, monitor Actor performance, fetch results, create and update versions, and more.

To access the API using Node.js, use the apify-client NPM package. To access the API using Python, use the apify-client PyPi package.

Check out the Apify API reference docs for full details or click on the API tab for code examples.

How can I build a Reddit scraper in Python?
You can create your own Reddit web scraper using a Python scraper template directly on the Apify platform and keep production there. Alternatively, you can develop it locally on your computer and only push it to the Apify cloud during deployment.

What is the difference between Reddit Scraper and Reddit Scraper Lite?
The functionality of both actor are the same. The difference is that the Lite version charges based on the number of results it extracts and it has a custom proxy configuration integrated with the actor that is cheaper than then the Residential proxies used by Apify. The Reddit Scraper version allows you to use either one of Apify`s proxies or a custom one.

Start URLs
OptionalarraystartUrls

Description:
If you already have URL(s) of page(s) you wish to scrape, you can set them here. If you want to use the search field below, remove all startUrls here.

Skip comments
OptionalbooleanskipComments

Description:
This will skip scrapping comments when going through posts

Default value of this property is: false

Skip user posts
OptionalbooleanskipUserPosts

Description:
This will skip scrapping user posts when going through user activity

Default value of this property is: false

Skip community
OptionalbooleanskipCommunity

Description:
This will skip scrapping community info but will still get community posts if they were not skipped.

Default value of this property is: false

Search Term
Optionalarraysearches

Description:
Here you can provide a search query which will be used to search Reddit`s topics.

Ignore start URLs
OptionalbooleanignoreStartUrls

Description:
Mainly used as a fix for ignoring starUrl on Zapier

Default value of this property is: false

Search for posts
OptionalbooleansearchPosts

Description:
Will search for posts with the provided search

Default value of this property is: true

Search for comments
OptionalbooleansearchComments

Description:
Will search for comments with the provided search

Default value of this property is: false

Search for communities
OptionalbooleansearchCommunities

Description:
Will search for communities with the provided search

Default value of this property is: false

Search for users
OptionalbooleansearchUsers

Description:
Will search for users with the provided search

Default value of this property is: false

Sort search
Optionalstringsort

Description:
Sort search by Relevance, Hot, Top, New or Comments

Options:
relevance
hot
top
new
rising
comments
Default value of this property is: "new"

Filter by date (Posts only)
Optionalstringtime

Description:
Filter posts by last hour, week, day, month or year

Options:
all
hour
day
week
month
year
Include NSFW content
OptionalbooleanincludeNSFW

Description:
You can choose to include or exclude NSFW content from your search

Default value of this property is: true

Maximum number of items to be saved
OptionalintegermaxItems

Description:
The maximum number of items that will be saved in the dataset. If you are scrapping for Communities&Users, remember to consider that each category inside a community is saved as a separated item.

Default value of this property is: 10

Limit of posts scraped inside a single page
OptionalintegermaxPostCount

Description:
The maximum number of posts that will be scraped for each Posts Page or Communities&Users URL

Default value of this property is: 10

Post date limit
OptionalstringpostDateLimit

Description:
Use this value when you want to get only posts after a specific date

Limit of comments scraped inside a single page
OptionalintegermaxComments

Description:
The maximum number of comments that will be scraped for each Comments Page. If you don't want to scrape comments you can set this to zero.

Default value of this property is: 10

Limit of `Communities`'s pages scraped
OptionalintegermaxCommunitiesCount

Description:
The maximum number of Communities's pages that will be scraped if your search or startUrl is a Communities type.

Default value of this property is: 2

Limit of `Users`'s pages scraped
OptionalintegermaxUserCount

Description:
The maximum number of Users's pages that will be scraped.

Default value of this property is: 2

Page scroll timeout (seconds)
OptionalintegerscrollTimeout

Description:
Set the timeout in seconds in which the page will stop scrolling down to load new items

Default value of this property is: 40

Proxy configuration
Requiredobjectproxy

Description:
Either use Apify proxy, or provide your own proxy servers.

Default value of this property is: {"useApifyProxy":true,"apifyProxyGroups":["RESIDENTIAL"]}

Debug Mode
OptionalbooleandebugMode

Description:
Activate to see detailed logs

Default value of this property is: false

Example:
{
"startUrls": [
{
"url": "https://www.reddit.com/r/pasta/comments/vwi6jx/pasta_peperoni_and_ricotta_cheese_how_to_make/"
}
],
"skipComments": false,
"skipUserPosts": false,
"skipCommunity": false,
"ignoreStartUrls": false,
"searchPosts": true,
"searchComments": false,
"searchCommunities": false,
"searchUsers": false,
"sort": "new",
"includeNSFW": true,
"maxItems": 10,
"maxPostCount": 10,
"maxComments": 10,
"maxCommunitiesCount": 2,
"maxUserCount": 2,
"scrollTimeout": 40,
"proxy": {
"useApifyProxy": true,
"apifyProxyGroups": [
"RESIDENTIAL"
]
},
"debugMode": false
}
