window.ChatBox = React.createClass({
    handleSend: function () {
        this.props.onSendMessage($(this.refs.chatInput).val());
        $(this.refs.chatInput).val('');
    },
    handleKeyUp: function (e) {
        if (e.keyCode == 13){
            this.handleSend();
        }
    },
    render: function () {
        var self = this;
        return <div className="well">
            <h5>Chat</h5>
            <center>
                Your name is <span className="strong">{this.props.playerName}</span><br />
                Your color is <span className="strong">{this.props.playerColor}</span>
            </center>
            <div className="chat">{this.props.chatHistory.map(function (entry, i) {
                if (entry.color === 'admin') {
                    return <pre key={i}>
                        <i>{entry.message}</i>
                    </pre>
                } else {
                    return <pre key={i}>
                        <i className={"fa fa-" + faClassNameOf(entry.color)}></i>
                        <b style={{marginLeft: 4}}>{entry.username + ": "}</b>
                        <span>{entry.message}</span>
                    </pre>
                }
            })}</div>

            <div className="chat-controls">
                <input
                    ref="chatInput"
                    onKeyUp={this.handleKeyUp}
                    className="form-control" />
                <button id="send" onClick={this.handleSend} className="btn"><i className="material-icons">&#xE163;</i></button>
            </div>
        </div>
    }
});