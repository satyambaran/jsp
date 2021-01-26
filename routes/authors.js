const express = require('express')
const Author = require('../models/author')
const router = express.Router()
const Book = require('../models/book')
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
    } catch {
        res.redirect('/')
    }
})

router.get('/new', (req, res) => { //  '/new' can be read as '/:id' that's why we wrote it above
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
router.post('/',async (req,res)=>{
    const author = new Author({
        name: req.body.name
    })
    try {
        const newAuthor = await author.save()
        res.redirect(`authors/${newAuthor.id}`)
        // res.redirect('authors')
    } catch (error) {
        res.render('authors/new', {
            author: author,
            errorMessage: 'Error Creating Author'
        })
    }
})
router.get('/:id',async (req, res) => {
    try {
        const author = await Author.findById(req.params.id)
        const books = await Book.find({author:author.id}).limit(8).exec()
        res.render('authors/show',{
            author:author,
            booksByAuthor:books
        })
    } catch (error) {
        //console.log(error)
        res.redirect('/')
    }
})
router.get('/:id/edit', async (req, res) => {
    // res.send('Edit' + req.params.id)
    try {
        const author = await Author.findById(req.params.id)
        res.render('authors/edit', {
            author: author
        })  
    } catch (error) {
        res.redirect('/authors')
    }
})
router.put('/:id',async (req, res) => {
    let author
    try {
        author = await Author.findById(req.params.id)
        author.name = req.body.name
        await author.save()
        res.redirect(`/authors/${author.id}`) //here giving '/' in front means we are giving full url, 
        //if we don't give this then it means it will be relative url so 'authors/${author.id}' will mean '/authors/authors/${author.id}' i.e. /authors/ will get added
        // res.redirect('authors')
    } catch (error) {
        if (author == null) {
            res.redirect('/')
        } else {
            res.render('authors/edit', {
                author: author,
                errorMessage: 'Error Updating Author'
            })
        }
    }
})
router.delete('/:id',async (req, res) => {
    let author
    try {
        author = await Author.findById(req.params.id)
        await author.remove()
        res.redirect('/authors') //here giving '/' in front means we are giving full url, 
        //if we don't give this then it means it will be relative url so 'authors/${author.id}' will mean '/authors/authors/${author.id}' i.e. /authors/ will get added
        // res.redirect('authors')
    } catch (error) {
        //console.log(error)
        if (author == null) {
            res.redirect('/')
        } else {
            res.redirect(`/authors/${author.id}`)
        }
    }
})
module.exports = router