const express = require('express');
const { response, request } = require('express');
const mongoose = require('mongoose');

const { config } = require('./config')

const app = express();
mongoose.connect(config.db.url, {useNewUrlParser: true, useUnifiedTopology: true})
.then(()=> console.log('Conectado!!'))
.catch((err)=> console.log('Hubo un error de conexion', err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ extended: true }));

// Articulos

const articuloSchema = new mongoose.Schema({
    nombre : String,
    precio : Number,
    existencias : Number
})

const Articulos = mongoose.model('Articulos', articuloSchema)

app.get('/', (request, response)=>{
    response.send('Funciona')
});



app.get('/articulo', (request, response)=>{
    Articulos.find()
    .then((rDB)=> response.status(200).json(rDB))
    .catch((err)=> response.status(400).json(err));
});

app.get("/articulo/:id", (request, response)=>{
    Articulos.findById(request.params.id)
    .then((rDB)=> response.status(200).json(rDB))
    .catch((err)=> response.status(400).json(err));

})

app.post('/articulo', (request, response)=>{
    const{ body } = request;
    const newArticulos = new Articulos(body)
    newArticulos.save()
    .then((rDB)=> response.status(201).json(rDB))
    .catch((err)=> response.status(400).json(err));
});

app.patch('/articulo/:id', (request, response)=>{
    Articulos.findByIdAndUpdate(request.params.id, request.body)
    .then((rDB)=> response.status(201).json(rDB))
    .catch((err)=> response.status(400).json(err));

});

app.delete('/articulo/:id', (request, response)=>{
    Articulos.findByIdAndDelete(request.params.id)
    .then((rDB)=> response.status(204).json(rDB))
    .catch((err)=> response.status(400).json(err));

});

// Tickets

const ticketSchema = new mongoose.Schema({
    subtotal : Number,
    iva : Number,
    total : Number,
    articulo : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "articulo",
    },
})

const Tickets = mongoose.model("Tickets", ticketSchema);

app.get('/ticket', (request, response)=>{
    Tickets.find((err, articulo)=>{
        Articulos.populate(articulo, {path:'articulo'}, (err, articulo)=>{
            response.status(200).send(articulo);
        })
    })
});

app.get("/ticket/:id", (request, response)=>{
    const { id } = request.params;
    Tickets.findById(id, (err, articulo)=>{
        Articulos.populate(articulo, {path: 'articulo'}, (err, articulo)=>{
            response.status(200).send(articulo)
        })
    })
})

app.post('/ticket', (request, response)=>{
    const{ body } = request;
    const newTickets = new Tickets(body)
    newTickets.save()
    .then((rDB)=> response.status(201).json(rDB))
    .catch((err)=> response.status(400).json(err));
});

app.patch('/ticket/:id', (request, response)=>{
    Tickets.findByIdAndUpdate(request.params.id, request.body)
    .then((rDB)=> response.status(201).json(rDB))
    .catch((err)=> response.status(400).json(err));

});

app.patch('/ticket/:id/checkout', (request, response)=>{
    const { id } = request.params;
    Tickets.findById(request.params.id, request.body)
    .populate('products')
    .then((ticket)=> {
        let prices = ticket.products.map((product)=> products.price)
        let subtotal = prices.reduce((total, price)=> total+price)
        const taxes = subtotal * .16 ;
        const total = subtotal + taxes;
        Tickets.findByIdAndUpdate(id, {subtotal, taxes, total, new: true})
        .then((ticketSumed)=> response.status(200).json(ticketSumed))
        .catch((err)=> response.status(400).json(err))
    })
})


app.delete('/ticket/:id', (request, response)=>{
    Tickets.findByIdAndDelete(request.params.id)
    .then((rDB)=> response.status(204).json(rDB))
    .catch((err)=> response.status(400).json(err));

});


app.listen (config.port, ()=> console.log(`Api esta activa en puerto: ${config.port}`))