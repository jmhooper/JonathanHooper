---
layout:     post
title:      Promises in Swift
date:       2015-04-02 14:00:00
summary:    Using Swift to implement something similiar to a JS Promise
---

### Promises

Javascript offers a [Promise](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Promise) class which is
very useful for doing lots of asynchronous things.

According to the MDN documentation a promise "represents a value that may not be available yet".
Essentially what this means is you have an object that represents some code that needs to be run to get a value.
After the code has been run and the value retrieved, you can access that value using the promise's `then()` function.

Here is an example:

{% highlight javascript %}
new Promise(function(resolve, reject) {
  var object = {a: "hello", b: "goodybe"}
  setTimeout(function() {
    resolve(object)
  }, 2000)
}).then(function(object) {
  console.log(JSON.stringify(object))
})

#=> {"a":"hello","b":"goodybe"}
{% endhighlight %}

The code above creates a promise for a simple inline Javascript object.
It waits 2 seconds and fulfills the promise with that object.
The promise's `then(callback)` function is used to access the object.

Promises also have a `catch()` function for handling errors that may occur.
Here is an example of how that works.

{% highlight javascript %}
new Promise(function(resolve, reject) {
  var object = {a: "hello", b: "goodybe"}
  setTimeout(function() {
    reject(new Error("Failed to resolve the object"))
  }, 2000)
}).then(function(object) {
  console.log(JSON.stringify(object))
}).catch(function(error) {
  console.log("An error occured: " + error)
})

#=> "An error occured: Failed to resolve the object"
{% endhighlight %}

In the code above the promise is rejected and the callback is given an error.
Since the promise was rejected the callback from the `then()` is ignored and the promise is handed down to the catch block which handles the error.

### Implementing Promises in Swift

Promises are great for doing things asynchronously because they provide a structure for working with objects
that need to be handled asynchronously.
They also provide a way to manage errors that helps to reduce the abundance of if/else statements that come along with
writing asynchronous code.

In iOS I find myself doing a lot of asynchronous programming and can't help but think
a Swift Promise object would be helpful.
There's a project called [PromiseKit](https://github.com/mxcl/PromiseKit) which offers a fully-featured promise object along
with some utilities for working with them.
But, if you want to make your own, implementing a simple promise object to use with Swift is not too difficult.

So the first thing a Promise is going to need is a enum to keep track of its status.
A promise can be in one of 3 states: pending, fulfilled, and revoked.

{% highlight swift %}
class Promise {

  enum Status {
    case Pending, Fulfilled, Revoked
  }

  var status: Status = .Pending

}
{% endhighlight %}

The next thing to add is the promise's executor.
This is the function that the promise runs asynchronously.
It takes two arguments, a callback to resolve the promise and a callback to revoke it.

{% highlight swift %}
class Promise {

  typealias Executor = (resolve: (object: AnyObject) -> Void, revoke: (error: NSError) -> Void) -> Void

  enum Status {
    case Pending, Fulfilled, Revoked
  }

  var status: Status = .Pending
  var executor: Executor

  init(executor: Executor) {
    self.executor = executor
  }

}
{% endhighlight %}

Now that we have the executor we need to actually use it.
When the promise is initialized we'll fire off the executor asynchronously.
For the revoke and resolve functions we'll add two callbacks to the promise object.
Those functions will change the status and save the fulfilled object or the error.

{% highlight swift %}
class Promise {

  typealias Executor = (resolve: (object: AnyObject) -> Void, revoke: (error: NSError) -> Void) -> Void

  enum Status {
    case Pending, Fulfilled, Revoked
  }

  var status: Status = .Pending
  var executor: Executor
  var fulfillment: AnyObject!
  var error: NSError!

  init(executor: Executor) {
    self.executor = executor
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), { () -> Void in
      self.executor(resolve: self.resolve, revoke: self.revoke)
    })
  }

  func resolve(object: AnyObject) {
    if self.status == .Pending {
      self.fulfillment = object
      self.status = .Fulfilled
    }
  }

  func revoke(error: NSError) {
    if self.status == .Pending {
      self.error = error
      self.status = .Revoked
    }
  }

}
{% endhighlight %}

The `revoke` and `resolve` callbacks are bounded by conditionals to make sure the promise is
in a pending state before they are executed.
This way we make sure only one of the callbacks is ever called once.

### Then

The next thing we need to do is implement the `then` function.

{% highlight swift %}
func then(#onFulfill: (object: AnyObject!) -> AnyObject!, onReject: (error: NSError) -> Void) -> Promise {
  return Promise(executor: { (resolve, revoke) -> Void in
    while self.status == .Pending {}
    if self.status == .Fulfilled {
      resolve(object: onFulfill(object: self.fulfillment))
    } else {
      onReject(error: self.error)
      revoke(error: self.error)
    }
  })
}
{% endhighlight %}

The `then` function returns another promise object.
If the callee promise is fulfilled, the new promise is resolved with the result of its fulfillment as an argument in the `onFulfill` block.
If the callee promise is revoked, the new promise is revoked with the callee's error.
Before the new promise is revoked the `onError` block is called.

If you were to use this promise object now, it would look like this.

{% highlight swift %}
Promise({ (resolve, revoke) -> Void in
  sleep(2)
  resolve(object: "hello")
}).then(onFulfill: { (object: AnyObject!) -> AnyObject! in
  var string: String = object as String
  return "\(string) world"
}, onReject: { (error: NSError) -> Void in

}).then(onFulfill: { (object: AnyObject!) -> AnyObject! in
  println(object)
  return nil
}, onReject: { (error: NSError) -> Void in

})

#=> "hello world"
{% endhighlight %}

Now this is not the clean, readable asynchronous operation that is promised to us by promises.
To get this to work the way we want we're going to have to overload the `then` method a few times.

{% highlight swift %}
func then(#onFulfill: (object: AnyObject!) -> AnyObject!, onReject: (error: NSError) -> Void) -> Promise {
  return Promise(executor: { (resolve, revoke) -> Void in
    while self.status == .Pending {}
    if self.status == .Fulfilled {
      resolve(object: onFulfill(object: self.fulfillment))
    } else {
      onReject(error: self.error)
      revoke(error: self.error)
    }
  })
}

func then(#onFulfill: (object: AnyObject!) -> Void, onReject: (error: NSError) -> Void) -> Promise {
  return self.then(onFulfill: { (object: AnyObject!) -> AnyObject! in
    onFulfill(object: object)
    return self.fulfillment
  }, onReject: { (error: NSError) -> Void in
    onReject(error: error)
  })
}

func then(onFulfill: (object: AnyObject!) -> AnyObject!) -> Promise {
  return self.then(onFulfill: onFulfill, onReject: { (error: NSError) -> Void in })
}

func then(onFulfill: (object: AnyObject!) -> Void) -> Promise {
  return self.then(onFulfill: onFulfill, onReject: { (error: NSError) -> Void in })
}
{% endhighlight %}

This lets us use `then` without having to specify an `onReject` block and without having to return a value from the `onFulfill` block.
After these changes the above "hello world" code looks like this.

{% highlight swift %}
Promise({ (resolve, revoke) -> Void in
  sleep(2)
  resolve(object: "hello")
}).then({ (object) -> AnyObject! in
  var string: String = object as String
  return "\(string) world"
}).then({ (object) -> Void in
  println(object)
})

#=> "hello world"
{% endhighlight %}

That's more like it.

There's one more thing we need to do to the `then` function.
We want a way to revoke a promise inside an `onFulfill` block.
Normally, with Javascript, you would just throw an error, but Swift doesn't support throw/catch error handling.
Instead, for this implementation I'm just going to return an error from the fulfillment block if I want to reject the promise.
This can be achieved by modifying the `then` function to check to see if the object returned is an error.

{% highlight swift %}
func then(#onFulfill: (object: AnyObject!) -> AnyObject!, onReject: (error: NSError) -> Void) -> Promise {
  return Promise(executor: { (resolve, revoke) -> Void in
    while self.status == .Pending {}
    if self.status == .Fulfilled {
      var fulfillmentObject: AnyObject! = onFulfill(object: self.fulfillment)
      if fulfillmentObject is NSError {
        revoke(error: fulfillmentObject as NSError)
      } else {
        resolve(object: fulfillmentObject)
      }
    } else {
      onReject(error: self.error)
      revoke(error: self.error)
    }
  })
}
{% endhighlight %}

You can test this out by returning an error

{% highlight swift %}
Promise({ (resolve, revoke) -> Void in
  sleep(2)
  resolve(object: "hello")
}).then({ (object) -> AnyObject! in
  return NSError(domain: "Promise", code: 1234, userInfo: [NSLocalizedDescriptionKey:"Promise broken :("])
}).then(onFulfill: { (object) -> Void in
  println(object)
}, onReject: { (error) -> Void in
  println("Error: \(error.localizedDescription)")
})

#=> "Error: Promise broken :("
{% endhighlight %}


### Catch

The last thing to do to finish the promise is to add the `catch` function.
If the promise is revoked the `catch` function should handle the error and halt operation.

It turns out this is very easy because the `catch` function is just a modified `then` function

{% highlight swift %}
func catch(onReject: (error: NSError) -> Void) -> Promise {
  return self.then(onFulfill: { (object: AnyObject!) -> Void in
    // do nothing
  }, onReject: { (error: NSError) -> Void in
    onReject(error: error)
  })
}
{% endhighlight %}

Now we can change our failing "hello world" code to look like this.

{% highlight swift %}
Promise({ (resolve, revoke) -> Void in
  sleep(2)
  resolve(object: "hello")
}).then({ (object) -> AnyObject! in
  return NSError(domain: "Promise", code: 1234, userInfo: [NSLocalizedDescriptionKey:"Promise broken :("])
}).then({ (object) -> Void in
  println(object)
}).catch({ (error) -> Void in
  println("Error: \(error.localizedDescription)")
})

#=> "Error: Promise broken :("
{% endhighlight %}

That's all there is to it.
Here's a gist for [Promise.swift](https://gist.github.com/jmhooper/a53bdd633aa49877b264).
