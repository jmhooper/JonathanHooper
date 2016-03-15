var headerNavDisplayed = false

function toggleHeaderNavDisplay() {
  if (headerNavDisplayed) {
    hideHeaderNav()
  } else {
    showHeaderNav()
  }
}

function showHeaderNav() {
  $("header nav").show()
  if ($(window).width() > 750) {
      $("header").height("96px")
    } else {
      $("header").height("376px")
    }
  $("header img#header-icon").attr("src", "/images/icons/x.svg")
  headerNavDisplayed = true
}

function hideHeaderNav() {
  $("header nav").hide()
  $("header").height("96px")
  $("header img#header-icon").attr("src", "/images/icons/hamburger.svg")
  headerNavDisplayed = false
}

$(function() {
  $("header img#header-icon").on("click", toggleHeaderNavDisplay)
  $(window).resize(function() {
    if ($(window).width() > 750) {
      showHeaderNav()
    } else {
      hideHeaderNav()
    }
  })
})
