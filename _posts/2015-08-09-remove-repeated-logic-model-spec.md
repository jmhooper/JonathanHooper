---
layout:     post
title:      Removing Repeated Logic From A Model/Spec
date:       2015-08-09 12:00:00
summary:    A refactor to DRY up a model and model spec that had some copy/pasted code.
---

I'm working on a Rails project right now that has multiple user types.
They are "Director", "Teacher", and "Student".
All three user types have a model.

In addition to those 3 models, there is a `User` model which handles authentication.
The user model has a [polymorphic association](http://guides.rubyonrails.org/association_basics.html#polymorphic-associations) named `role` . The `Director`, `Teacher`, and `Student` models are all on the other end of that relationship.

With that in mind, I added these methods to the `User` model:

```ruby
class User < ActiveRecord::Base
  belongs_to :role, polymorphic: true

  def director?
    role_type == "Director"
  end

  def teacher?
    role_type == "Teacher"
  end

  def student?
    role_type == "Student"
  end
end
```

I'm using [RSpec](https://github.com/rspec/rspec-rails) & [Factory Girl](https://github.com/thoughtbot/factory_girl) to write my tests for this project.
The spec for these methods looked like this:

```ruby
describe User, "#director?" do
  it "should return true when the user is a director" do
    user = build(:director_user)
    expect(user.director?).to eq(true)
  end

  it "should return false if the user is not a #{role}" do
    user = build(:teacher_user)
    expect(user.director?).to eq(false)
  end
end

describe User, "#teacher?" do
  it "should return true when the user is a teacher" do
    user = build(:teacher_user)
    expect(user.teacher?).to eq(true)
  end

  it "should return false if the user is not a #{role}" do
    user = build(:director_user)
    expect(user.teacher?).to eq(false)
  end
end

describe User, "#student?" do
  it "should return true when the user is a student" do
    user = build(:student_user)
    expect(user.student?).to eq(true)
  end

  it "should return false if the user is not a #{role}" do
    user = build(:teacher_user:)
    expect(user.student?).to eq(false)
  end
end
```

In just a short glance at this, you can see a lot of repeated work and copy/pasted code.

This kind of repeated logic makes all kinds of messes.
If we want to come back and change up this logic a bit later, that will involve updating not just one,
but three methods.
This can get out of control pretty quickly.

I encourage programmers to try and write code without using copy/paste at all.
Let's see if we can't refactor this a bit to look more like that's what we did.

We can start with the model:

```ruby
class User < ActiveRecord::Base
  belongs_to :role, polymorphic: true

  [Director, Teacher, Student].each do |role_class|
    define_method("#{role_class.name.underscore}?") do
      role_type == role_class.name
    end
  end
end
```

This invokes some meta programming to do exactly the same thing as the earlier model code.

We iterate through all of the classes that have a polymorphic association with our model.
Then we use the `define_method` method to add a method with the pattern `class_name?` to the model.
Inside that method we have the same logic we did earlier, but this time it's all in one place.

Now let's look at the spec:

```ruby
roles = [:director, :teacher, :student]
roles.each do |role|
  describe User, "\##{role}?" do
    it "should return true when the user is a #{role}" do
      user = build("#{role}_user".to_sym)
      expect(user.send("#{role}?".to_sym)).to eq(true)
    end

    it "should return false if the user is not a #{role}" do
      other_role = (roles - [role]).first
      user = build("#{other_role}_user".to_sym)
      expect(user.send("#{role}?".to_sym)).to eq(false)
    end
  end
end
```

Here we have a similar situation.
We have an array of symbols to represent each model on the other end of our polymorphic assocation.
We use these symbols to describe the tests.
Then we use the symbol to create a string that we would expect to match the method name we want to test.
We use the `send` method to call a method with that name on our record and check the result.
