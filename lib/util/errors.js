class ArithmeticError extends Error {

    constructor(msg) {
        super(msg);
        this.name = ArithmeticError.name;
    }
}