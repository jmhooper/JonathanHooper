---
layout:     post
title:      Introducing BRewge
date:       2015-09-11 12:00:00
summary:    My Baton Rouge Open Data Project
---

![Brewge](/images/2015-09-11/brewge-screenshot.png)

I recently moved to a new part of town.
Overall it has been a nice experience.
I've been having fun meeting lots of new neighborhoods
and getting to know a whole new crew of stray cats.

The other night, however, I realized one downside of moving into a "neighborhood".
There are no corner stores out here.
At my old apartment I could have a friend over, we could walk down to one of the convenience stores
on either corner and pick
up a few brews.
In my new neighborhood it's only houses for a couple blocks.

Curious about places I could go to buy booze in a pinch
I turned to [Open Data BR](https://data.brla.gov/).
Sure enough they have the data for businesses registered in East Baton Rouge.
Additionally they keep track of the those business's ABC status and geolocation information.

It isn't difficult to put together a URL that'll give you a JSON response with all of Baton Rouge's open
businesses with a liquor license: [https://data.brla.gov/resource/xw6s-bcqm.json?tabc=1&tstatus=O](https://data.brla.gov/resource/xw6s-bcqm.json?tabc=1&tstatus=O)

Thinking other people may be interested in this information, I decided to throw together a quick iOS
application to present the data.
And that is how BRewge was born.

I built a version 1.0 that grabbed the data from the Open Data API and displayed it in a table view and on a map.
If you are willing to give BRewge your location it will sort the businesses by distance from you.
I pushed version 1.0 to the store that night.

During the next week I realized the geolocation data for several of the businesses was completely wrong.
I'm not sure why but open data was giving me location information that was pretty far off.

Since the businesses data included addresses I decided to try to mitigate the problem by geocoding the addresses on the device.
I ran into 2 problems.

First, there were almost 1000 businesses.
Geocoding almost 1000 addresses with Apple's built in geocoding tools and with Google Maps's API both
turned out to take entirely too long to be feasible.

Secondly I ran into rate limits with both services.

What I ended up doing was building an API between Open Data and my app.
The API has a local cache of businesses that it refreshes every 24 hours.
When it refreshes the businesses it attempts to geocode the addresses with the Google Maps API.
If the refresh succeeds, the coordinates Google returns are saved for the business.
If the refresh fails, it falls back on the coordinates provided by Open Data.

I wrapped all of this up in a version 1.1 and pushed it to the store.
If you wanna download the app, you can go grab it [here](https://itunes.apple.com/us/app/brewge/id1029802700).

The App is written in Swift using the native iOS SDK. You can check it out [on Github](https://github.com/jmhooper/BRewge-iOS) if you are curious.

The API is written with Node.js and Express. You can check it out [on Github](https://github.com/jmhooper/BRewge-API) as well.
