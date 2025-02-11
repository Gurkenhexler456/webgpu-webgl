class Diagnostics {

    /**
     * @type {Diagnostics}
     */
    static #INSTANCE = null;

    #log_to_console = false;
    #logging_enabled = false;
    #log = [];

    constructor(log_to_console){
        if(Diagnostics.#INSTANCE !== null) {
            throw new Error('Diagnostics: only one instance allowed');
        }

        this.#logging_enabled = true;
        this.#log_to_console = log_to_console;
    }

    static init() {
        Diagnostics.#INSTANCE = new Diagnostics(false);
    }

    static log(msg) {
        if(Diagnostics.#INSTANCE.#logging_enabled) {
            const current_date = new Date().toISOString();
            Diagnostics.#INSTANCE.#log.push(`${current_date}: ${msg}`);
        }
    }

    static get_log_as_string() {

        return Diagnostics.#INSTANCE.#log.join('\n');
    }
}