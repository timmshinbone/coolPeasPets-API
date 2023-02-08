// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for examples
const Pet = require('../models/pet')

// custom middleware
const customErrors = require('../../lib/custom_errors')
const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const removeBlanks = require('../../lib/remove_blank_fields')
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// ROUTES

// POST -> create a toy(and give that toy to a pet)
// POST /toys/:petId
// anybody should be able to give a pet a toy
// so we wont requireToken
// our toy schema, has some non-required fields, so let's use removeBlanks
router.post('/toys/:petId', removeBlanks, (req, res, next) => {
    // isolate our toy from the request, and save to variable
    const toy = req.body.toy
    // isolate and save our pet's id for easy reference
    const petId = req.params.petId
    // find the pet and push the new toy into the pet's array
    Pet.findById(petId)
        // first step is to use our custom 404 middleware
        .then(handle404)
        // handle adding toy to pet
        .then(pet => {
            console.log('the pet: ', pet)
            console.log('the toy: ', toy)
            // add toy to toys array
            pet.toys.push(toy)

            // save the pet
            return pet.save()
        })
        // send info after updating the pet
        .then(pet => res.status(201).json({ pet: pet }))
        // pass errors along to our error handler
        .catch(next)
})

// PATCH -> update a toy
// PATCH /toys/:petId/:toyId
router.patch('/toys/:petId/:toyId', requireToken, removeBlanks, (req, res, next) => {
    // get and save the id's to variables
    const petId = req.params.petId
    const toyId = req.params.toyId

    // find our pet
    Pet.findById(petId)
        .then(handle404)
        .then(pet => {
            // single out the toy
            const theToy = pet.toys.id(toyId)
            // make sure the user is the pet's owner
            requireOwnership(req, pet)
            // update accordingly
            theToy.set(req.body.toy)

            return pet.save()
        })
        // send a status
        .then(() => res.sendStatus(204))
        .catch(next)
})

// DELETE -> destroy a toy
// DELETE /toys/:petId/:toyId

// export our router
module.exports = router