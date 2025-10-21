# Downloads

Date: 2025-10-21

When a user applies filters to a dataset, a table of results is displayed in the UI, and the user can download the data in that table.


## Implementing the download

We considered several approaches to making download work. From the front-end perspective, the options are:

1. Simply present an anchor element
2. From javascript, download the file into memory, then shove it into a data url of a new anchor element, and fire a click event against that element
3. From javascript, use file system access api to get a file handle on user's drive, then stream the downloaded file into that file handle

## Option 1: Use an html anchor element linking to the endpoint

Advantages:
- This is a native browser functionality (browser shows file progress)
- No dependency on the web page after the download has started (user can refresh the page or close the tab)
- (Maybe) browser can resume the download if the connection breaks, given that the server can support this
- Very simple to add

Disadvantages:
- Javascript on the page does not know when download starts, or whether and when it succeeds. Thus, it is impossible to signal in the UI that a download has actually started, or is still happening. It can become especially jarring if it takes a long time for the server to start the response.
- Anchor tag only understands GET requests.
  - In the context of the AMR app, urls for the GET requests may become quite long
  - Perhaps it would be possible to have a form with a `target="_blank"` attribute submit a POST request, to which the server responds with a file; but we have not explores this.


## Option 2: Download the file into memory in js, then trigger browser download through a new anchor tag with data ulr

Advantages:
- JS has full control over the download, and as a result, it is possible to give custom UI feedback to the user
- It is possible to use POST requests to fetch the file

Disadvantages:
- File size is limited to the amount of available memory
- If the browser is configured to show a dialog for where to save the file, this dialog would appear only after the file has finished downloading into memory (i.e. confusing and inconvenient for the user)
- File download is coupled to the web page — can't refresh it or close the tab without interrupting the download
- More complicated than option 1

## Option 3: Use file system access API to stream the file to the disk while downloading

Advantages:
- Same as in Option 2
- The 'save file' system dialog would be shown at the start of the download
- Downloaded file can be streamed to user's drive without incurring memory pressure on the browser

Disadvantages:
- File system access API is only supported in Chromium-based browsers, and requires https (or localhost)
- Similarly to option 2, file download is coupled to the web page — can't refresh it or close the tab without interrupting the download
- Similarly to option 2, More complicated than option 1


## Decision

After considering the three available options, we decided to go with the first one, i.e. just use an html anchor element.