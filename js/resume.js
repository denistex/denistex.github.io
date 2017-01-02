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

  var indent = {indent: 20}
  var indent2 = {indent: 40}
  var indent3 = {indent: 60}

  var handlers = {
    skills: function (doc, values) {
      for (var i = 0; i < values.length; ++i) {
        regular(doc, '- ' + values[i].skill + ': ' +
            values[i].technologies.join(', '), indent)
      }
    },
    experience: function (doc, values) {
      for (var i = 0; i < values.length; ++i) {
        regular(doc, '- ' + values[i].from + ' - ' + values[i].to + ':', indent)

        regular(doc, values[i].employer +
            (values[i].href ? ' (' + values[i].href + ')' : ''), indent2)

        regular(doc, values[i].description, indent2)

        if (values[i].responsibilities) {
          regular(doc, 'Responsibilities:', indent2)
          for (var j = 0; j < values[i].responsibilities.length; ++j) {
            regular(doc, '- ' + values[i].responsibilities[j], indent3)
          }
        }

        regular(doc, 'Tags: ' + values[i].tags.join(', '), indent2)

        doc.moveDown()
      }
    },
    education: function (doc, values) {
      for (var i = 0; i < values.length; ++i) {
        regular(doc, '- ' + values[i].from + ' - ' + values[i].to + ':', indent)

        regular(doc, values[i].school +
            (values[i].href ? ' (' + values[i].href + ')' : ''), indent2)

        regular(doc, values[i].description, indent2)

        doc.moveDown()
      }
    }
  }

  title(doc, window.pdfdata.title)
  regular(doc, window.pdfdata.email)

  for (key in window.pdfdata.resume) {
    if (!key.startsWith('_')) {
      header1(doc, key.toUpperCase())
    }
    if (handlers[key]) {
      handlers[key](doc, window.pdfdata.resume[key])
    }
  }

  doc.end()
})

function text (doc, size, value, style) {
  doc.fontSize(size)
  doc.text(value, style)
}

function title (doc, value) {
  text(doc, 18, value)
}

function header1 (doc, value) {
  doc.moveDown()
  text(doc, 16, value)
  doc.moveDown(0.2)
}

function regular (doc, value, style) {
  doc.moveDown(0.2)
  text(doc, 14, value, style)
  doc.moveDown(0.2)
}
