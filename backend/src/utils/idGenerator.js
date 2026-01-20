const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateOrderId() {
    let suffix = "";
    for(let i = 0; i< 16; i++){
        suffix += ALPHANUM.charAt(
            Math.floor(Math.random()*ALPHANUM.length)
        )
    }

    return `order_${suffix}`;
}