const express = require('express')
const Book = require('../models/book')
const Author = require('../models/author')
const router = express.Router()
// const multer = require('multer')
//const path = require('path')
//const fs = require('fs')
//const uploadPath = path.join('public',Book.coverImageBasePath)
const imageMimeTypes = ['image/jpeg','image/png','image/gif']
// const upload = multer({
//     dest: uploadPath,
//     fileFilter: (req, file, callback)=>{
//         callback(null,imageMimeTypes.includes(file.mimetype))
//     }
// })
router.get('/',async (req,res)=>{
    let query = Book.find()
    if (req.query.title != null && req.query.title !== '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    if (req.query.publishedBefore != null && req.query.publishedBefore !== '') {
        query = query.gte('publishDate', new RegExp(req.query.publishedBefore, 'i'))
    }
    if (req.query.publishedAfter != null && req.query.publishedAfter !== '') {
        query = query.lte('publishDate', new RegExp(req.query.publishedAfter, 'i'))
    }
    try {
        const books = await query.exec()
        res.render('books/index',{
            books:books,
            searchOptions:req.query
        })
    } catch (error) {
        console.log(error)
        res.redirect('/')
    }
})
router.get('/new',async (req,res)=>{
    renderNewPage(res,new Book())
})
router.post('/',async (req,res)=>{
    //const fileName = req.file != null ? req.file.filename:null
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate) ,  // new Date is to convert string to date
        pageCount: req.body.pageCount,
        //coverImageName: fileName,
        description: req.body.description
    })
    saveCover(book,req.body.cover)
    try {
        const newBook = await book.save()
        res.redirect('books/$(newBook.id')
        //res.redirect('books') 
    } catch (error) {
        /*if(book.coverImageName!=null){
            removeBookCover(book.coverImageName)
        }*/

        renderNewPage(res,book,true)
    }
})
router.get('/:id', async (req,res)=>{
    try {
        const book = await Book.findById(req.params.id)
            .populate('author')
            .exec()
        res.render('books/show', {
            book: book
        })
    } catch (error) {
        res.redirect('/')
    }
})
router.get('/:id/edit', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
        renderEditPage(res, book)
    } catch (error) {
        res.redirect('/')
    }
})
router.put('/:id', async (req, res) => {
    //const fileName = req.file != null ? req.file.filename:null
    let book 
    try {
        book = await Book.findById(req.params.id)
        book.title = req.body.title
        book.author = req.body.author
        book.publishDate = req.body.publishDate
        book.pageCount = req.body.pageCount
        book.description = req.body.description
        if(req.body.cover !=null && req.body.cover!==''){
            saveCover(book,req.body.cover)
        }
        res.redirect(`/books/${book.id}`)
        await book.save()
    } catch (error) {
        if (book!=null) {
            renderEditPage(res,book,true)
        }else{
            res.redirect('/')
        }
    }
})
router.delete('/:id',async (req,res)=>{
    let book
    try {
        book = await Book.findById(req.params.id)
        await book.remove()
        res.redirect('/books')
    } catch (error) {
        if(book!=null){
            res.render('books/show',{
                book:book,
                errorMessage: 'Could not delete'
            })
        } else {
            res.redirect('/')
        }
    }
})
/*function removeBookCover(fileName) {
    fs.unlink(path.join(uploadPath,fileName),err=>{
        if(err) console.error(err)
    })
}
router.get('/',async (req,res)=>{
    let searchOptions = {}
    if(req.query.name != null && req.query.name!==""){
        searchOptions.name = new RegExp(req.query.name,'i')
    }
    try {
        const authors = await Author.find(searchOptions)
        res.render('authors/index',{
            authors:authors, 
            searchOptions:req.query
        })
    } catch (error) {
        res.redirect('/')
    }
})

router.get('/new',(req,res)=>{
    res.render('authors/new',{author: new Author()})
})
/*
router.get('/',(req,res)=>{
    res.render('authors/index')
})
router.post('/',(req,res)=>{
    const author = new Author({
        name:req.body.name
    })
    author.save((err,newAuthor)=>{
        if(err){
            res.render('authors/new',{
                author:author,
                errorMessage:'Error Creating Author'
            })
        }else{
            //res.redirect('authors/$(newAuthor.id')
            res.redirect('authors')
        }
    })
})*/
/*router.post('/',async (req,res)=>{
    const author = new Author({
        name:req.body.name
    })
    try {
        const newAuthor = await author.save()
        //res.redirect('authors/$(newAuthor.id')
        res.redirect('authors')
    } catch (error) {
        res.render('authors/new',{
            author:author,
            errorMessage:'Error Creating Author'
        })
    }
})*/
async function renderNewPage(res, book, hasError = false) {
    renderFormPage(res, book, 'new', hasError)
}
async function renderEditPage(res, book, hasError = false) {
    renderFormPage(res, book, 'edit', hasError)
}
async function renderFormPage(res, book, form, hasError = false) {
    try {
        const authors = await Author.find({})
        const params = {
            authors: authors,
            book: book
        }
        if (hasError) {
            if (form === 'edit') params.errorMessage = 'Error updating book'
            else{
                params.errorMessage = 'Error creating book'
            }
        }
        res.render(`books/${form}`, params)
    } catch (error) {
        res.redirect('/books')
    }
}
function saveCover(book,coverEncoded) {
    if(coverEncoded==null) return
    const cover = JSON.parse(coverEncoded)
    if (cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data,'base64')
        book.coverImageType = cover.type
    }
    
}
module.exports = router