const Note = require ('../models/Note')
const User = require ('../models/User')
const asyncHandler = require('express-async-handler')

// @desc Get all notes 
// @route GET /notes
// @access Private

const getAllNotes = asyncHandler(async (req, res) => {
    //get all notes from mongodb
    const notes = await Note.find().lean()

    //if not notes
    if( !notes?.length){
        return res.status(400).json({ message: 'No notes found'})
    }

    // add usernme to each note before sending response

    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username}
    }))

    res.json(notesWithUser)
    
})

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = asyncHandler(async (req, res) => {
    const {user, title, text } = req.body

    // Confirm data
    if(!user || !title || !text){
        return res.status(400).json({message : 'All fields required'})
    }

    // Check for duplicate Titles
    
    const duplicate = await Note.findOne({title}).lean().exec()
    
    if (duplicate){
        return res.status(400).json({ message: 'Duplicate Title'})
    }

    // Create and store new Note
    const noteObject = {user, title, text}
    const note = await Note.create(noteObject)

    if(note){
        res.status(201).json({ message: `New Note ${title} created`})
    }else{
        res.status(400).json({ message: 'Invalid Note data received'})
    }
})

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
    const {id, user, title, text, completed} = req.body

    // Confirm data
    if (!id || !user || !title || !text || !completed){
        return res.status(400).json({ message: 'All fields are required'})
    }

    // Confirm note exisits with ID

    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note does not exist'})
    }

    // Check for duplicate

    const duplicate = await Note.findOne({title}).lean().exec()

    if (duplicate){
        return res.status(400).json({ message: 'Duplicate Title'})
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json (`${updatedNote.title} updated`)
    
    
})

// @desc Delete a note
// @route DELETE /notes
// @access Private

const deleteNote = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Note ID required' })
    }

    // Confirm note exists to delete 
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    const title = note.title
    const ids = note._id

    const result = await note.deleteOne()

    const reply = `Note '${title}' with ID ${ids} deleted`

    res.json(reply)
}

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}