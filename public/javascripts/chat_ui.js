function divEscapedContentElement(message) {
    return '<div>' + message +'</div>';
}

function divSystemContentElement(message) {
    return $('<div></div>').html('<i>' + message+'</i>');
}