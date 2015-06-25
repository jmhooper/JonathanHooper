---
layout:     post
title:      Doorkeeper With Multiple Models
date:       2015-04-25 12:00:00
summary:    Using doorkeeper to authenticate resources from more than one model
---

[Doorkeeper](https://github.com/doorkeeper-gem/doorkeeper) is a Rails gem for creating an OAuth2 provider for your app.
I've been working on a project that uses it to do authentication for its API.
We ran into a little trouble authenticating resources from different models.

Doorkeeper has an initializer which it uses to setup the methods it needs for authentication.
In the initializer you can define the methods `resource_owner_authenticator` and `resource_owner_from_credentials` which
provide the authentication portion of the [authorization code data flow](https://aaronparecki.com/articles/2012/07/29/1/oauth2-simplified#web-server-apps)
and the [password grant data flow](https://aaronparecki.com/articles/2012/07/29/1/oauth2-simplified#others) respectively.
These methods both have access to the session for the authorization request and are expected to return the authenticated resource.

```ruby
## config/initializers/doorkeeper.rb
Doorkeeper.configure do
  resource_owner_authenticator do
    current_user || redirect_to(new_user_sessions_path)
  end

  resource_owner_from_credentials do |routes|
    u = User.find_for_database_authentication(:email => params[:username])
    u if u && u.valid_password?(params[:password])
  end
end
```

After an API client follows one of these Oauth2 authorization data flows, gets an access token, and uses it to access some part of the API,
Doorkeeper provides the controller with a `doorkeeper_token` helper method which provides a hash with some information relating to the access token.
The hash has a key named `resource_owner_id` which corresponds to the id of the resource that the token was generated for.

```ruby
## app/controllers/api/v1/api_controller.rb
class ApiController < ActionController::Base
  before_action :doorkeeper_authorize!

  def current_resource_owner
    User.find(doorkeeper_token.resource_owner_id) if doorkeeper_token
  end
end
```

This is where we ran into a snag.
Our project had two models, and doorkeeper only provides the id of the resource, not the type.
So we had an id, but we did not know how to determine from that what the resource was because we
did not know which model it corresponded to.

The solution, it turns out, is actually very simple.
The hash retrieved by `doorkeeper_token` also contains a key named `scopes` which corresponds to the `scope` param in the OAuth authenticate request.
So the answer is to require a scope on the authentication request and use it to determine what type of user was trying to authenticate.
Then, in the controller, use the scopes value in the `doorkeeper_token` hash to determine what resource type the access token corresponds to.

```ruby
## config/initializers/doorkeeper.rb
Doorkeeper.configure do
  resource_owner_authenticator do
    if params[:scope] == 'buyer'
      current_buyer
    elsif params[:scope] == 'seller'
      current_seller
    else
      redirect_to(new_buyer_sessions_path)
    end
  end

  resource_owner_from_credentials do |routes|
    user = nil
    if params[:scope] == 'buyer'
      user = Buyer.find_for_database_authentication(email: params[:username])
    elsif params[:scope] == 'seller'
      user = Seller.find_for_database_authentication(email: params[:username])
    end
    user if user && user.valid_password?(params[:password])
  end
end

## app/controllers/api/v1/api_controller.rb
class ApiController < ActionController::Base
  before_action :doorkeeper_authorize!

  def current_resource_owner
    if doorkeeper_token && doorkeeper_token.scopes.include?('buyer')
      Buyer.find(doorkeeper_token.resource_owner_id)
    elsif doorkeeper_token && doorkeeper_token.scopes.include?('seller')
      Seller.find(doorkeeper_token.resource_owner_id)
    end
  end
end
```
