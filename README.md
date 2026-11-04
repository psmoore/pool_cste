# Coronado Swim Team Elite weekly practice schedule — Pool Relay embed preview

An unofficial replica of the CSTE **Weekly Practice Schedule** page, rebuilt around a live
[Pool Relay](https://www.poolrelay.com) calendar, with sign-up so each swimmer's family can
follow just their own group.

**This is not a Coronado Swim Team Elite website.** The official page is
<https://www.swimcste.com/page/competitive-team/weekly-practice-schedule>. This is a
working preview of one proposed change to it, and the page says so in a ribbon across the top.

## What the current page does

- Two hand-typed tables, one per venue (Canyonview Aquatic Center at UC San Diego, and the
  Coronado Community Center Pool), with a "Scroll left on mobile app" hint under each.
- A long "Exceptions to the schedules above" list typed below the tables. Most of its dates
  are already in the past.
- "We will communicate changes, updates and other related club information through WhatsApp."

## What this preview does instead

- **One calendar, both pools.** Every block names its pool (Triton, Marcikic, or the
  Competition Pool) and its lane count. On a phone it opens as a list.
- **The calendar is the exceptions list.** A changed day is simply that day in its week.
  The page quotes the club's current exceptions (struck through once past) beside what the
  live calendar holds for the same date.
- **Follow one group.** The embed's own **Subscribe** button lets a family pick a group, get
  an email when it changes (after confirming their address), and add it to Apple, Google or
  Outlook Calendar.
- **Your group at a glance.** Each group's next practice and coming week, read from the same
  feed.

```html
<iframe src="https://www.poolrelay.com/embed/EbEgsHHb3IfFI1rQYekJ7F"
        width="100%" height="820" style="border:0"
        title="Coronado Swim Team Elite practice schedule"></iframe>
```

## Nothing schedule-like is typed

Every day, time, pool, lane count and notice on the page comes from the public feed
(`cste.js` reads `https://www.poolrelay.com/api/public/views/<token>/project`). The HTML types
only group names, ages, days per week and links. The only times and dates in the HTML are the
club's own exceptions list, shown as a labeled quote of their page.

## Data

Pool Relay files the club under its SportsEngine owner, **San Diego Swim Club**. The tab is
locked to that organization and shows six groups: Senior, Age Group and Age Group Development
at Canyonview (UCSD), and Age Group 1, 2 and 3 at the Coronado Aquatics Center. UCSD bookings
come from the facility's published window; Coronado's from the club's posted pattern.

## Notes

- The CSTE wordmark is plain CSS text, not the club's logo artwork.
- Navigation links point at the live site and open in a new tab. `noindex` is set.

## Local preview

```
python3 -m http.server 8831
```
