var C = {
  INDENT:  [0, 60, 80, 150],

  LEFT: 25,
  RIGHT: 588,

  WIDTH: 450,
  EXTENDED_WIDTH: 535,
  TAGS_WIDTH: 588,

  SUMMARY_LEFT: 85,
  SUMMARY_WIDTH: 390,
}

$('#pdf').click(function () {
  var updated = new Date(window.pdfdata.resume._updated)

  var doc = new PDFDocument({
    info: {
      Title: window.pdfdata.title,
      Author: window.pdfdata.author,
      Subject: 'Resume',
      CreationDate: updated,
      ModDate: updated
    }
  })

  var stream = doc.pipe(blobStream())
  stream.on('finish', function () {
    var blob = stream.toBlob('application/pdf')
    var url = stream.toBlobURL('application/pdf')

    var a = document.createElement('a')
    document.body.appendChild(a)
    a.style = 'display: none'
    a.href = url
    a.download = 'resume.pdf'
    a.click()
    document.body.removeChild(a)
  })

  var handlers = {
    summary: function (doc, value) {
      summ(doc, value.header)
      summ(doc, value.text)
    },
    skills: function (doc, values) {
      for (var i = 0; i < values.length; ++i) {
        skill(doc,
            '- ' + values[i].skill + ': ' + values[i].technologies.join(', '))
      }
    },
    experience: function (doc, values) {
      for (var i = 0; i < values.length; ++i) {
        timestamp(doc, values[i].from + ' - ' + values[i].to)
        organization(doc, values[i].employer)
        description(doc, values[i].description)
        position(doc, values[i].position)

        if (values[i].responsibilities) {
          doc.moveDown(0.2)
          for (var j = 0; j < values[i].responsibilities.length; ++j) {
            responsibility(doc, '- ' + values[i].responsibilities[j])
          }
          doc.moveDown(0.2)
        }

        if (values[i].href) {
          href(doc, values[i].href)
        }

        tags(doc, '[ ' + values[i].tags.join(' | ') + ' ]')

        doc.moveDown(1.5)

        if (values[i].span) {
          doc.moveDown(values[i].span)
        }
      }
    },
    education: function (doc, values) {
      for (var i = 0; i < values.length; ++i) {
        timestamp(doc, values[i].from + ' - ' + values[i].to)
        organization(doc, values[i].school)

        if (values[i].href) {
          href(doc, values[i].href)
        }

        description(doc, values[i].description)

        doc.moveDown(0.5)
      }
    },
    contacts: function (doc, values) {
      contact(doc, 'Location', values.location)
      contact(doc, 'Website', window.pdfdata.url)
      contact(doc, 'Email', window.pdfdata.email)
      contact(doc, 'GitHub', '@' + window.pdfdata.github_username)
      contact(doc, 'Telegram', '@' + values.telegram)
      contact(doc, 'LinkedIn', '@' + values.linkedin)
      contact(doc, 'Twitter', '@' + values.twitter)
    }
  }

  startline(doc)
  title(doc, window.pdfdata.title)
  email(doc, window.pdfdata.email)

  for (key in window.pdfdata.resume) {
    if (!key.startsWith('_')) {
      section(doc, key.toUpperCase())
    }
    if (handlers[key]) {
      handlers[key](doc, window.pdfdata.resume[key])
    }
  }

  section(doc, 'METAINFO')
  metainfo(doc, 'Updated', window.pdfdata.resume._updated)

  doc.end()
})

function wordwrap (input, width) {
  var result = ['']

  var arr = input.split(' ')
  for (var i = 0; i < arr.length; ++i) {
    var extended = (result[result.length - 1] + ' ' + arr[i]).trim()
    if (extended.length < width) {
      result[result.length - 1] = extended
    } else {
      result.push(arr[i])
    }
  }

  return result
}

function getStyle (indent) {
  return {
    indent: C.INDENT[indent],
    width: C.WIDTH,
  }
}

function startline (doc) {
  doc.moveUp(3)
    .moveTo(C.LEFT, doc.y)
    .lineTo(C.RIGHT, doc.y)
    .lineWidth(10)
    .strokeColor('gray')
    .stroke()
    .moveDown(1.5)
}

function title (doc, value) {
  doc.fontSize(18)
    .font('Times-Roman')
    .fillColor('black')
    .text(value, C.LEFT, doc.y, getStyle(0))
}

function email (doc, value) {
  doc.moveDown(0.2)
    .fontSize(14)
    .font('Times-Roman')
    .fillColor('black')
    .text(value, C.LEFT, doc.y, getStyle(0))
    .moveDown(0.2)
}

function section (doc, value) {
  doc.moveDown(1.6)
    .fontSize(16)
    .font('Times-Bold')
    .fillColor('gray')
    .text(value, C.LEFT, doc.y, getStyle(0))
    .moveDown(0.2)
    .moveTo(C.LEFT, doc.y - 5)
    .lineTo(C.RIGHT, doc.y - 5)
    .lineWidth(1)
    .strokeColor('gray')
    .stroke()
    .moveDown(0.2)
}

function summ (doc, value) {
  var style = {
    indent: C.INDENT[0],
    width: C.SUMMARY_WIDTH,
    align: 'justify'
  }
  doc.moveDown(0.2)
    .fontSize(13)
    .font('Times-Roman')
    .fillColor('black')
    .text(value, C.SUMMARY_LEFT, doc.y, style)
    .moveDown(0.2)
}

function skill (doc, value) {
  doc.moveDown(0.2)
    .fontSize(13)
    .font('Times-Roman')
    .fillColor('black')
    .text(value, C.LEFT, doc.y, getStyle(1))
    .moveDown(0.2)
}

function timestamp (doc, value) {
  doc.moveDown(0.2)
    .fontSize(13)
    .font('Times-Roman')
    .fillColor('gray')
    .text(value, {align: 'right', width: C.EXTENDED_WIDTH})
    .moveUp(1.2)
}

function organization (doc, value) {
  doc.moveDown(0.2)
    .fontSize(14)
    .font('Times-Bold')
    .fillColor('black')
    .text(value, C.LEFT, doc.y, getStyle(1))
    .moveDown(0.2)
}

function position (doc, value) {
  doc.fontSize(13)
    .font('Times-Roman')
    .fillColor('black')
    .text(value, C.LEFT, doc.y, getStyle(2))
}

function description (doc, value) {
  var values = wordwrap(value, 70)
  for (var i = 0; i < values.length; ++i) {
    doc.fontSize(13)
      .font('Times-Italic')
      .fillColor('black')
      .text(values[i], C.LEFT, doc.y, getStyle(2))
      .moveDown(0.2)
    }
}

function href (doc, value) {
  doc.fontSize(12)
    .font('Courier')
    .fillColor('black')
    .text(value, C.LEFT, doc.y, getStyle(2))
    .moveDown(0.4)
}

function responsibility (doc, value) {
  var values = wordwrap(value, 70)
  for (var i = 0; i < values.length; ++i) {
    doc.moveDown(0.2)
      .fontSize(13)
      .font('Times-Roman')
      .fillColor('black')
      .text(values[i], C.LEFT, doc.y, getStyle(2))
      .moveDown(0.2)
  }
}

function tags (doc, value) {
  doc.moveDown(0.2)
    .fontSize(12)
    .font('Courier')
    .fillColor('black')
    .text(value, C.LEFT, doc.y, {indent: C.INDENT[2], width: C.TAGS_WIDTH})
    .moveDown(0.2)
}

function contact (doc, name, value) {
  doc.moveDown(0.2)
    .fontSize(13)
    .font('Times-Bold')
    .fillColor('gray')
    .text(name + ':', C.LEFT, doc.y, getStyle(1))
    .moveUp(1.0)
    .font('Times-Roman')
    .fillColor('black')
    .text(value, C.LEFT, doc.y, getStyle(3))
    .moveDown(0.2)
}

function metainfo (doc, name, value) {
  doc.moveDown(0.2)
    .fontSize(13)
    .font('Times-Bold')
    .fillColor('gray')
    .text(name + ':', C.LEFT, doc.y, getStyle(1))
    .moveUp(1.0)
    .font('Times-Roman')
    .fillColor('black')
    .text(value, C.LEFT, doc.y, getStyle(3))
    .moveDown(0.2)
}
