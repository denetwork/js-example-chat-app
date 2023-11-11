import {
	ChatMessage,
	ChatType,
	ClientConnect,
	JoinRoomRequest,
	LeaveRoomRequest,
	LeaveRoomResponse,
	MsgType,
	PullMessageRequest,
	PullMessageResponse,
	ReceiveMessageCallback,
	ResponseCallback,
	SendMessageRequest,
	VaChatRoomEntityItem
} from "denetwork-chat-client";
import React from "react";
import { EtherWallet, TWalletBaseItem, Web3Digester, Web3Signer } from "web3id";
import _ from "lodash";
import { PageUtil } from "denetwork-utils";


export interface ChatMessageListProps
{
	serverUrl : string;
	roomId : string;
}

export interface ChatMessageListState
{
	serverUrl : string;
	roomId : string;

	loading : boolean;
	value : string;
	messages : Array<ChatMessage>;
}

/**
 * 	@class
 */
export class ChatMessageList extends React.Component<ChatMessageListProps, ChatMessageListState>
{
	initialized : boolean = false;
	messagesEnd : any = null;

	//
	//	create a wallet by mnemonic
	//
	mnemonic : string = 'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient';
	walletObj : TWalletBaseItem = EtherWallet.createWalletFromMnemonic( this.mnemonic );
	chatMessageList : Array<ChatMessage> = [];
	clientConnect ! : ClientConnect;

	receiveMessageCallback : ReceiveMessageCallback = ( message : SendMessageRequest, callback ? : ( ack : any ) => void ) =>
	{
		console.log( `ReceiveMessageCallback received a message: `, message );
		if ( _.isObject( message ) && _.has( message, 'payload' ) )
		{
			//	TODO
			//	remove duplicate item
			this.chatMessageList.push( message.payload );
			this.setState( {
				messages : this.chatMessageList
			} );
			console.log( `chatMessageList:`, this.chatMessageList );
		}
		else
		{
			throw new Error( `invalid message` );
		}

		if ( _.isFunction( callback ) )
		{
			callback( 200 );
		}
	}


	constructor( props : any )
	{
		if ( ! _.isString( props.serverUrl ) || _.isEmpty( props.serverUrl ) )
		{
			throw new Error( `invalid serverUrl` );
		}
		if ( null !== VaChatRoomEntityItem.isValidRoomId( props.roomId ) )
		{
			throw new Error( `invalid roomId` );
		}

		//	...
		super( props );
		this.state = {
			serverUrl : props.serverUrl,
			roomId : props.roomId,
			messages : [],

			loading : true,
			value : ''
		};
		//	...
		this.clientConnect = new ClientConnect( this.state.serverUrl, this.receiveMessageCallback );

		//	...
		this.onClickJoinRoom = this.onClickJoinRoom.bind( this );
		this.onClickLeaveRoom = this.onClickLeaveRoom.bind( this );
		this.onClickSendMessage = this.onClickSendMessage.bind( this );
		this.onInputKeyDown = this.onInputKeyDown.bind( this );
		this.onInputValueChanged = this.onInputValueChanged.bind( this );
	}

	componentDidUpdate()
	{
		this._scrollToBottom();
	}

	componentDidMount()
	{
		if ( this.initialized )
		{
			console.log( `🍔 componentDidMount, already initialized` );
			return;
		}
		this.initialized = true;

		//	...
		console.log( `🍔 componentDidMount` );
		this._joinChatRoom( async ( _response : any ) =>
		{
			await this._asyncLoadQueueMessage();
			this._scrollToBottom();

			//	...
			setTimeout( () =>
			{
				this.setState( { loading : false } );

			}, 1000 );
		} );
	}

	private _scrollToBottom()
	{
		this.messagesEnd.scrollIntoView({ behavior: "smooth" });
	}


	private _joinChatRoom( callback ? : ResponseCallback )
	{
		this.clientConnect.joinRoom( {
			roomId : this.state.roomId
		} as JoinRoomRequest, ( response : any ) : void =>
		{
			console.log( `💎 join room response: `, response );
			if ( _.isFunction( callback ) )
			{
				callback( response );
			}
		} );
	}

	private async _asyncPullMessage( startTimestamp ? : number, endTimestamp ? : number, pageNo ? : number, pageSize ? : number ) : Promise<PullMessageResponse>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				this.clientConnect.pullMessage( {
					roomId : this.state.roomId,
					startTimestamp : _.isNumber( startTimestamp ) ? startTimestamp : 0,
					endTimestamp : _.isNumber( endTimestamp ) ? endTimestamp : -1,
					pagination : {
						pageNo : PageUtil.getSafePageNo( pageNo ),
						pageSize : PageUtil.getSafePageSize( pageSize )
					}
				} as PullMessageRequest, ( response : PullMessageResponse ) : void =>
				{
					console.log( `🐹 pull data from the specified room and return the response: `, response );
					resolve( response );
				} );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	private async _asyncLoadQueueMessage()
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const startTimestamp = 0;
				const endTimestamp = -1;
				const pageSize = 30;
				let pageNo = 1;
				while ( true )
				{
					const pullMessageResponse : PullMessageResponse = await this._asyncPullMessage( startTimestamp, endTimestamp, pageNo, pageSize );
					console.log( `pullMessageResponse :`, pullMessageResponse );
					if ( ! _.isObject( pullMessageResponse ) ||
						! _.has( pullMessageResponse, 'status' ) ||
						! _.has( pullMessageResponse, 'list' ) )
					{
						return reject( `invalid pullMessageResponse` );
					}
					if ( ! Array.isArray( pullMessageResponse.list ) ||
						0 === pullMessageResponse.list.length )
					{
						return resolve( true )
					}

					let changed : boolean = false;
					for ( const item of pullMessageResponse.list )
					{
						if ( _.isObject( item ) &&
							_.isObject( item.data ) )
						{
							const chatMessage : SendMessageRequest = item.data;
							if ( _.isObject( chatMessage ) )
							{
								changed = true;
								this.chatMessageList.push( chatMessage.payload )
							}
						}
					}
					if ( changed )
					{
						this.setState( { messages : this.chatMessageList } );
						this._scrollToBottom();
					}

					//	...
					pageNo++;
				}
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}


	onClickJoinRoom( e : any )
	{
		e.preventDefault();
		this._joinChatRoom();
	}

	onClickLeaveRoom( e : any )
	{
		e.preventDefault();
		const callback : ResponseCallback = ( response : LeaveRoomResponse ) : void =>
		{
			console.log( `🌶️ leave room response: `, response );
		};
		this.clientConnect.leaveRoom( {
			roomId : this.state.roomId
		} as LeaveRoomRequest, callback );
	}

	private async _asyncSendMessage() : Promise<boolean>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const callback : ResponseCallback = ( response : any ) : void =>
				{
					console.log( `🍔 send message response: `, response );
				};
				let chatMessage : ChatMessage = {
					msgType : MsgType.SEND,
					chatType : ChatType.GROUP,
					wallet : this.walletObj.address,
					fromName : `XING`,
					fromAvatar : `https://www.avatar.com/aaa.jgp`,
					roomId : this.state.roomId,
					body : this.state.value,
					timestamp : new Date().getTime(),
					hash : '',
					sig : '',
				};
				chatMessage.sig = await Web3Signer.signObject( this.walletObj.privateKey, chatMessage );
				chatMessage.hash = await Web3Digester.hashObject( chatMessage );
				const sendMessageRequest : SendMessageRequest = {
					payload : chatMessage
				}
				console.log( `will send message: `, sendMessageRequest );
				this.clientConnect.sendMessage( sendMessageRequest, callback );
				resolve( true );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	onClickSendMessage( e : any )
	{
		e.preventDefault();
		this._asyncSendMessage().then( res =>
		{
			console.log( `onClickSendMessage :`, res );
			this.setState({ value : '' });
		} ).catch( err =>
		{
			console.error( `onClickSendMessage :`, err );
		} )
	}

	onInputValueChanged( e : any )
	{
		this.setState( { value : e.target.value } );
	}
	onInputKeyDown( e : any )
	{
		if ( 'Enter' === e.key )
		{
			this.onClickSendMessage( e );
		}
	}

	render()
	{
		return (
			<div>
				<div className="RoomIdDiv sticky-top">roomId: { this.state.roomId }</div>
				<div className="ChatMessageList">
					{ this.state.messages.map( ( item : any ) =>
						<div key={ item.hash }>
							{ item.fromName } / { new Date( item.timestamp ).toLocaleString() }
							<br/>
							{ item.body }
							<hr/>
						</div>
					) }
				</div>

				{ this.state.loading ? (
					<div className="BarDiv sticky-bottom">Loading, please wait ...</div>
				) : (
					<div className="BarDiv sticky-bottom">
						<button onClick={ this.onClickJoinRoom }>Join</button>
						&nbsp;
						<button onClick={ this.onClickLeaveRoom }>Leave</button>
						&nbsp;&nbsp;&nbsp;
						<input className="MessageInput"
						       autoFocus
						       placeholder="Say something ..."
						       value={ this.state.value }
						       onKeyDown={ this.onInputKeyDown }
						       onChange={ this.onInputValueChanged }></input>
						&nbsp;
						<button onClick={ this.onClickSendMessage }>Send</button>
					</div>
				) }
				<div style={{ float:"left", clear: "both" }}
				     ref={(el) => { this.messagesEnd = el; }}>
				</div>
			</div>
		);
	}
}
