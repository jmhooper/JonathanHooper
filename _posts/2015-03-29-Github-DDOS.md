---
layout:     post
title:      Working With Git While Github is Down
date:       2015-03-29 4:00:00
summary:    The Github DDOS attach inspired me to play around with git a bit.
---

So [github is down](https://github.com/blog/1981-large-scale-ddos-attack-on-github-com) for the time being which is inconvenient.
It got me thinking about a potential situation.

Two people are working on a project with github and github goes down.
Both of them still have their local copies, but they also have un-pushed commits.
If one of them could email their copy of the project to to the other, how could they could be merged into up to date repositories?

I decided to set up a little experiment and see what I could learn.

I put together a local git repository on my machine.
I put a commit on it and made a copy of it.
Then I created a commit on each copy.

It turns out getting both of these up to date is pretty easy.

When you run `git pull` you can specify the URL for a repository.
You can use this to pull from a local repository by specifying the file path.

```
git pull /path/to/project_copy
```

After cleaning up a merge conflict I was able to look at the commit history and see everything was where I would expect it to be.

```
$ git --no-pager log

commit 2723f9233c26ddf161ab9e1ccf2f111d771ab93e
Merge: 5280799 caf6b7a
Author: Jonathan Hooper <Jonathan@newaperio.com>
Date:   Sun Mar 29 16:11:44 2015 -0500

Merge /Users/Jonathan/Temporary/project_copy

Conflicts:
Readme.md

commit caf6b7aae8478c8279ca6e7e5a157549e63f1a5f
Author: Jonathan Hooper <Jonathan@newaperio.com>
Date:   Sun Mar 29 15:51:08 2015 -0500

Project02

commit 5280799d547d2f4412373e96db1956f65e4ba542
Author: Jonathan Hooper <Jonathan@newaperio.com>
Date:   Sun Mar 29 15:50:42 2015 -0500

Project01

commit bebf47d61bdb63bf457fd6ee37c1fa7d2b0b0c69
Author: Jonathan Hooper <Jonathan@newaperio.com>
Date:   Sun Mar 29 15:48:25 2015 -0500

First Commit
```

Switching over to the other repository and pulling from the up to date repository brings both repositories up to date.

### Setting Up A Shared Remote

Another option is to setup the repo you want to pull from as a remote.

```
git remote add project_copy /Users/Jonathan/Temporary/project_copy
git pull project_copy master
```

This is actually a nice solution because it allows you to host a repo on your machine that the other person can use from their machine.

To do this you'll need a user for them so that git will be able to ssh into your machine.
You'll also want to setup that repo so that the two of you can push commits to it.

To setup a repo that you can share, first clone a bare copy of the repo that you can push and pull from.

```
git clone --bare /Users/Jonathan/Temporary/project /Users/git-user/project/shared_repo
```

One this is done you can set it up as a remote on your machine and the other person's.


```
# Local Machine
git remote add shared_repo /Users/git-user/project/shared_repo.git
git pull shared_repo master

# Remote Machine
git remote add shared_repo git-user@192.168.1.100:/Users/git-user/project/shared_repo.git
git pull shared_repo master
```

No you can both push and pull from that remote as if github were up and running.
Whenever it does come back up you can move any new commits to your origin remote and continue business a usual.
