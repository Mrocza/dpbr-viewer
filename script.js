var page = 1;
var index = 0;
var data = [];
var inData = [];
var paused;
var intervalId;

// artist:derekireba
// artist:holivi
$('#column_count').val(Math.ceil($(window).width()/400))

$('#search-button').on('change', function() {
  if ( !$(this).prop('checked') ) start()
});
$("#tags").on('keyup', function(e) {
  if (e.keyCode == 13) $("#search-button").click();
});
$("#tags").on('input', function(e) {

  return // autocomplete disabled

  if ($("#tags").val().length < 1) {
    $("#autocomplete").html('')
    return;
  }
  for (let tag of TAGS621) {
    if ( tag[0].includes == undefined ) console.log(tag);
    if ( tag[0].startsWith($("#tags").val()) ) {
      $("#autocomplete").html(tag[0]); return;
    }
  }

});






var overlayID = 0
$('#column_container').on('click', function(e) {
  let art = $(e.target)
  if (art.prop('class') != 'art') return;
  window.overlayID = art.parent().prop('id');
  console.log(window.data[window.overlayID])
  $('#overlay').append(art.clone())
  $('#overlay').append(packageArt(window.data[window.overlayID].images[0].link)).css({
    'display':'flex'
  })
  for (let tag of window.data[window.overlayID].tags) {
    $('#taglist').append($('<div>', {
      'html': '- + '+tag
    }))
  }
});
$('#overlay').on('click', function(e) {
  if ($(e.target).prop('id') != 'overlay') return;
  $('#overlay').css('display','none');
  $('#overlay .art').remove();
  $('#taglist div').remove();
});
$('#close').on('click', function(e) {
  $('#overlay').css('display','none');
  $('#overlay .art').remove();
  $('#taglist div').remove();
});
$('#follow').on('click', function(e) {
  console.log(window.data[window.overlayID].url)
  window.open(window.data[window.overlayID].url, '_blank');
});
$('#next').on('click', function(e) {
  window.overlayID++
  $('#overlay .art').remove()
  $('#overlay').append($('#'+overlayID+' .art').clone())
  $('#overlay').append(packageArt(window.data[window.overlayID].images[0].link)).css({
    'display':'block'
  })
});
$('#auto').on('click', function(e) {
  setInterval(function() {
    window.overlayID++
    $('#overlay .art').remove()
    $('#overlay').append($('#'+overlayID+' .art').clone())
    $('#overlay').append(packageArt(window.data[window.overlayID].images[0].link)).css({
      'display':'block'
    })
  }, 5000)
});


$('#min-score').on('input', function() {
  $('#min-score-text').html($(this).val());
  if (+$(this).val() > $('#max-score').val()) {
    $('#max-score').val($(this).val());
    $('#max-score-text').html($(this).val());
  }
})
$('#max-score').on('input', function() {
  $('#max-score-text').html($(this).val());
  if (+$(this).val() < $('#min-score').val()) {
    $('#min-score').val($(this).val());
    $('#min-score-text').html($(this).val());
  }
})




function start() {
  $('#search-button').prop('checked', false)
  window.paused = 0;
  window.page = 1;
  window.index = 0;
  window.data = [];
  window.inData = [];

  $('img').prop('src','');
  $('#column_container').empty();
  for (var i = 0; i < $('#column_count').val(); i++) {
    $('<div>', {'class':'column'}).appendTo('#column_container');
  }
  if (window.intervalId) clearInterval(window.intervalId);
  window.intervalId = window.setInterval(renderimage, 300/$('#column_count').val());
}

function renderimage() {
  if (window.paused) return;
  if (getShortestColumn().height()-$(window).scrollTop() > 2*$(window).height()) return;


  if (window.inData.length != 0) {
    window.data = window.data.concat(braidArrays(...window.inData))
  }
  window.inData = [];

  if (window.data[window.index] == undefined) {
    if ($('#derpibooru').prop('checked')) getPhilomena();
    if ($('#rule34').prop('checked')) getGelbooru();
    if ($('#e621').prop('checked')) getE621();
    return;
  }

  createCard(window.data[window.index]).appendTo(getShortestColumn());
  window.index++;
}

function createCard(data) {
  let card = $('<div>', {
    'id': window.index,
    'class': 'card',
    'css': { 'padding-bottom': 100/data.aspectRatio+'%' }
  });
  let cardWidth = $('#column_container').width() / $('#column_count').val();
  let cardHeight = cardWidth / data.aspectRatio;
  let src = data.images[0].link;
  for (let image of data.images) {
    if (image.w > cardWidth || image.h > cardHeight) src = image.link;
  }

  return card.append(packageArt(src));
}

function getPhilomena() {
  window.paused++;
  var query = $('#tags').val();
  if (query == '') query = '*';

  let safe = $('#safe').prop('checked'),
      questionable = $('#questionable').prop('checked'),
      explicit = $('#explicit').prop('checked'),
      animated = $('#animated').prop('checked');
  if (!safe) query += ', -safe';
  if (!questionable) query += ', -suggestive, -questionable';
  if (!explicit) query += ', -explicit';
  if (!animated) query += ', -animated';

  if ($('#min-score').val() != -1000)
    query += `, score.gte:${$('#min-score').val()}`;
  if ($('#max-score').val() !=  5000)
    query += `, score.lte:${$('#max-score').val()}`;


  console.log(query)
  $.getJSON('https://derpibooru.org/api/v1/json/search/images', {
    'per_page': 50,
    'page': window.page,
    'q': query,
    'filter_id': 56027,
    'sf': $('input[name="sf"]:checked').val()
  }).done(function(APIreply) {
    console.log(APIreply)
    if (APIreply.images.length == 0) return;
    let array = []
    for(var image of APIreply.images) {
      array.push({
        'id': image.id,
        'url': 'https://derpibooru.org/images/'+image.id,
        'format': image.format,
        'aspectRatio': image.aspect_ratio,
        'tags': image.tags,
        'images': [
          { 'w': image.width,
            'h': image.height,
            'link': image.representations.full
          },
          { 'w': (image.aspect_ratio > 0.25) ? 1024 : 4096*image.aspect_ratio,
            'h': (image.aspect_ratio < 0.25) ? 4096 : 1024/image.aspect_ratio,
            'link': image.representations.tall
          },
          { 'w': (image.aspect_ratio > 1.33) ? 1280 : 1024*image.aspect_ratio,
            'h': (image.aspect_ratio < 1.33) ? 1024 : 1280/image.aspect_ratio,
            'link': image.representations.large
          },
          { 'w': (image.aspect_ratio > 1.33) ? 800 : 600*image.aspect_ratio,
            'h': (image.aspect_ratio < 1.33) ? 600 : 800/image.aspect_ratio,
            'link': image.representations.medium
          },
          { 'w': (image.aspect_ratio > 1.33) ? 320 : 240*image.aspect_ratio,
            'h': (image.aspect_ratio < 1.33) ? 240 : 320/image.aspect_ratio,
            'link': image.representations.small
          },
          { 'w': (image.aspect_ratio > 1) ? 250 : 250*image.aspect_ratio,
            'h': (image.aspect_ratio < 1) ? 250 : 250/image.aspect_ratio,
            'link': image.representations.thumb
          },
          { 'w': (image.aspect_ratio > 1) ? 150 : 150*image.aspect_ratio,
            'h': (image.aspect_ratio < 1) ? 150 : 150/image.aspect_ratio,
            'link': image.representations.thumb_small
          },
          { 'w': (image.aspect_ratio > 1) ? 50 : 50*image.aspect_ratio,
            'h': (image.aspect_ratio < 1) ? 50 : 50/image.aspect_ratio,
            'link': image.representations.thumb_tiny
          }],
      });
    }
    window.inData.push(array);
    window.page++
    window.paused--;
  })

}

function getE621() {
  window.paused++;
  var query = $('#tags').val()
    .replace(/([A-z]) ([A-z])/g,'\1_\2')
    .replace(/,/g, '');
  query += ' order:'+$('input[name="sf"]:checked').val()

  if ($('#min-score').val() != -1000)
    query += ' score:>=' + $('#min-score').val();
  if ($('#max-score').val() !=  5000)
    query += ' score:<=' + $('#max-score').val();

  let safe = $('#safe').prop('checked'),
      questionable = $('#questionable').prop('checked'),
      explicit = $('#explicit').prop('checked'),
      animated = $('#animated').prop('checked');
  if (!animated) query += ' -animated';
  if ( safe && !questionable && !explicit) query += ' rating:s';
  if (!safe &&  questionable &&  explicit) query += ' -rating:s';
  if (!safe &&  questionable && !explicit) query += ' rating:q';
  if ( safe && !questionable &&  explicit) query += ' -rating:q';
  if (!safe && !questionable &&  explicit) query += ' rating:e';
  if ( safe &&  questionable && !explicit) query += ' -rating:e';
  if ( safe &&  questionable && !explicit) query += ' -rating:e';
  if (!safe && !questionable && !explicit) query  = 'invalid';

  console.log(query)
  $.getJSON('https://e621.net/posts.json', {
    'page': window.page,
    'limit': 50,
    'tags': query
  }).done(function(APIreply) {
    console.log(APIreply)
    if (APIreply.posts.length == 0) return;
    let array = [];
    for(var image of APIreply.posts) {
      array.push({
        'id': image.id,
        'url': 'https://e621.net/posts/'+image.id,
        'format': image.file.ext,
        'aspectRatio': image.file.width / image.file.height,
        'tags': image.tags.general,
        'images': [
          { 'w': image.file.width,
            'h': image.file.height,
            'link': image.file.url
          },
          { 'w': image.sample.width,
            'h': image.sample.height,
            'link': image.sample.url
          },
          { 'w': image.preview.width,
            'h': image.preview.height,
            'link': image.preview.url
          }],
      });
    }
    window.inData.push(array);
    window.page++
    window.paused--;
  })
}

function getGelbooru() {
  window.paused++;

  var query = $('#tags').val();
  if (query == '') query = '*';

  $('.filter').each( function() {
    if (!$(this).prop('checked')) query += ', -' + $(this).prop('id');
  })

  if ($('#min-score').val() != -1000)
    query += ', score:>=' + $('#min-score').val();
  if ($('#max-score').val() !=  5000)
    query += ', score:<=' + $('#max-score').val();


  query = query.replaceMultiple({
    'safe':'rating:safe',
    'questionable': 'rating:questionable',
    'explicit': 'rating:explicit',
    '([A-z]) ([A-z])': '\1_\2',
    ',': ''
  })

  query += ' sort:'+$('input[name="sf"]:checked').val()

  console.log(query)
  $.getJSON('https://api.rule34.xxx/index.php', {
    'page': 'dapi',
    's': 'post',
    'json': 1,
    'limit': 50,
    'pid': window.page-1,
    'q': 'index',
    'tags': query
  }).done(function(APIreply) {
    console.log(APIreply)
    if (APIreply.length == 0) return;
    let array = [];
    for(var image of APIreply) {
      array.push({
        'id': image.id,
        'url': 'https://rule34.xxx/index.php?page=post&s=view&id='+image.id,
        'format': image.file_url.split('.').pop().trim(),
        'aspectRatio': image.width / image.height,
        'images': [
          { 'w': image.width,
            'h': image.height,
            'link': image.file_url
          },
          { 'w': image.sample_width,
            'h': image.sample_height,
            'link': image.sample_url
          },
          { 'w': (image.width>image.height) ? 250 : 250*image.width/image.height,
            'h': (image.width<image.height) ? 250 : 250/image.width/image.height,
            'link': image.preview_url
          }],
      });
    }
    window.inData.push(array);
    window.page++
    window.paused--;
  })
}

function packageArt(source) {
  switch (source.split('.').pop()) {
    case 'svg': case 'png': case 'jpg': case 'jpeg': case 'gif':
      return $('<img>', {
        'class': 'art',
        'src': source,
        'loading': 'lazy',
      });
    case 'mp4': case 'webm':
      return $('<video>', {
        'class': 'art',
        'src': source,
      });
    default:
      console.log(`Unknown format "${data.format}" on ${data.id}`);
      return $('<img>')
  }
}
function formatNumber(num) {
  if (num < -1e3) return (num/1e3).toFixed(1) + 'k';
  if (num <  1e3) return num;
  if (num <  1e4) return (num/1e3).toFixed(1) + 'k';
  if (num <  1e6) return (num/1e3).toFixed(0) + 'k';
  if (num <  1e7) return (num/1e6).toFixed(1) + 'M';
}
function formatTime(dateString) {
  var relative = new Date( new Date() - new Date(dateString) );
  if (relative.getYear() == 71) return '1 year ago';
  if (relative.getYear() > 71) return relative.getYear()-70 + 'years ago';
  if (relative.getMonth() == 1) return '1 month ago';
  if (relative.getMonth() > 1) return relative.getMonth() + 'months ago';
  if (relative.getDate() == 2) return '1 day ago';
  if (relative.getDate() > 2) return relative.getDate()-1 + 'days ago';
  if (relative.getHours() == 1) return '1 hour ago';
  if (relative.getHours() > 1) return relative.getHours() + 'hours ago';
  if (relative.getMinutes() == 1) return '1 minute ago';
  if (relative.getMinutes() > 1) return relative.getMinutes() + 'minutes ago';
  return 'just now';
}
function getShortestColumn() {
  let output
  let currentHeight = Number.MAX_SAFE_INTEGER
  $('.column').each( function() {
    if ($(this).height() < currentHeight) {
      currentHeight = $(this).height();
      output = $(this);
    }
  });
  return output
}
String.prototype.replaceMultiple = function(obj) {
  let output = this;
  for (let key in obj) {
    output = output.replace(new RegExp(key,'g'), obj[key]);
  }
  return output;
};
function braidArrays([x, ...xs], ...rest) {
  if (x == undefined) {
    if (rest.length == 0) return [];
    else return braidArrays(...rest);
  }
  return [x, ...braidArrays(...rest, xs)];
}
