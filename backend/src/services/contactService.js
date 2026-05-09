import Contact from "../models/Contact";


export const contactService = {
    async getContacts() {
        const contacts = await Contact.findAll();
        return contacts;
    },
    async getContactById(id) {
        const contact = await Contact.findByPk(id);
        if (!contact) {
            throw new Error('Contact not found');
        }
        return contact;
    },
    as
}