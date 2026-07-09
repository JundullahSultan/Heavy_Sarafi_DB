import { useEffect, useState } from "react"

function MedicineControll() {
    const [med, setMed] = useState([])

    useEffect(function() {
        setTimeout(() => {
            setMed(med => [...med, "Paracetamol", "Amoxicillin", "Ibuprofen"])
        }, 2000);
    }, [])

    return <div>
        <h1>Wholesale Inventory</h1>
        {med.length >= 1 && <ul>{med.map(med, i => <MedList med={med} key={i} />)}</ul>}
    </div>
}

function MedList({med}) {
    return <li>{med}</li>
}