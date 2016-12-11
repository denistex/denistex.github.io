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
    skills: function (doc, values) {
      for (var i = 0; i < values.length; ++i) {
        regular(doc, '- ' + values[i].skill + ': ' +
            values[i].technologies.join(', '), {indent: 20})
      }
    },
    experience: function (doc, values) {
      for (var i = 0; i < values.length; ++i) {
        regular(doc, '- ' + values[i].company + ' (' + values[i].href + '): ' +
            values[i].description, {indent: 20})
      }
    },
    interests: function (doc, values) {
      for (var i = 0; i < values.length; ++i) {
        regular(doc, '- ' + values[i], {indent: 20})
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
