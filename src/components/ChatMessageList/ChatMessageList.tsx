import {
	ChatMessage, ChatRoomMember,
	ChatType,
	ClientConnect, ClientRoom, GroupMessageCrypto,
	JoinRoomRequest,
	LeaveRoomRequest,
	LeaveRoomResponse,
	PaginationOrder, PrivateMessageCrypto,
	PullMessageRequest,
	PullMessageResponse,
	ReceiveMessageCallback,
	ResponseCallback,
	SendMessageRequest,
	VaChatRoomEntityItem
} from "denetwork-chat-client";
import React from "react";
import { EtherWallet, TWalletBaseItem } from "web3id";
import _, { memoize } from "lodash";
import { PageUtil } from "denetwork-utils";
import "./ChatMessageList.css";
import { PopupInvitation } from "../PopupInvitation/PopupInvitation";
import { ChatRoomEntityItem, ChatRoomMemberType } from "denetwork-chat-client/dist/entities/ChatRoomEntity";


export interface LastTimestamp
{
	//
	//	key : roomId
	//	value : timestamp
	//
	[ key : string ] : number;
}

export interface ChatMessageListProps
{
	serverUrl : string;
}

export interface ChatMessageListState
{
	serverUrl : string;
	roomId : string;
	roomItem : ChatRoomEntityItem;
	userId : number;	//	current user id

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

	refPopupInvitation : React.RefObject<any>;
	refPopupJoin : React.RefObject<any>;
	mnemonicList : Array<string> = [
		'olympic cradle tragic crucial exit annual silly cloth scale fine gesture ancient',
		'evidence cement snap basket genre fantasy degree ability sunset pistol palace target',
		'electric shoot legal trial crane rib garlic claw armed snow blind advance'
	];
	userName : Array<string> = [ 'Alice', 'Bob', 'Mary' ];

	//
	//	create a wallet by mnemonic
	//
	walletObj !: TWalletBaseItem;
	clientConnect ! : ClientConnect;
	clientRoom !: ClientRoom;
	chatMessageList : Array<ChatMessage> = [];
	lastTimestamp : LastTimestamp = {};

	receiveMessageCallback : ReceiveMessageCallback = ( message : SendMessageRequest, callback ? : ( ack : any ) => void ) =>
	{
		console.log( `ReceiveMessageCallback received a message: `, message );
		if ( _.isObject( message ) && _.has( message, 'payload' ) )
		{
			//	TODO
			//	remove duplicate item
			if ( message.payload.roomId === this.state.roomId )
			{
				this._decryptMessage( message ).then( ( decryptedMessage : SendMessageRequest ) =>
				{
					this.chatMessageList.push( decryptedMessage.payload );
					this.setState( {
						messages : this.chatMessageList
					} );
					this._scrollToBottom();
					console.log( `chatMessageList:`, this.chatMessageList );

				}).catch( err =>
				{
					console.error( `receiveMessageCallback : `, err );
				});
			}
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

		//	...
		super( props );
		this.state = {
			serverUrl : props.serverUrl,
			roomId : ``,
			roomItem : {} as ChatRoomEntityItem,
			userId : 1,

			messages : [],
			loading : false,
			value : ''
		};
		//	...
		this.clientConnect = new ClientConnect( this.state.serverUrl, this.receiveMessageCallback );
		this.clientRoom = new ClientRoom();

		//	...
		this.refPopupInvitation = React.createRef();
		this.refPopupJoin = React.createRef();

		//	...
		this.onClickJoinRoom = this.onClickJoinRoom.bind( this );
		this.onClickLeaveRoom = this.onClickLeaveRoom.bind( this );
		this.onClickSendMessage = this.onClickSendMessage.bind( this );
		this.onClickLoadMore = this.onClickLoadMore.bind( this );
		this.onInputKeyDown = this.onInputKeyDown.bind( this );
		this.onClickInvitation = this.onClickInvitation.bind( this );
		this.onClickJoin = this.onClickJoin.bind( this );
		this.onInputValueChanged = this.onInputValueChanged.bind( this );
		this._onChatMessageListScroll = this._onChatMessageListScroll.bind( this );
	}

	componentDidUpdate()
	{
		//this._scrollToBottom();
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
		this.initUser();

		//	...
		console.log( `🍔 componentDidMount` );
	}

	private initUser()
	{
		let userIdString : string | null = localStorage.getItem( `current.userId` ) || '1';
		const userId : number = parseInt( userIdString );
		this.setUser( userId );
	}


	public setUser( userId : number )
	{
		this.setState({
			userId : userId,
		})
		console.log( `⭐️ user changed to: `, userId, this.userName[ userId - 1 ], this.mnemonicList[ userId - 1 ] );
		localStorage.setItem( `current.userId`, userId.toString() );
		localStorage.setItem( `current.userName`, this.userName[ userId - 1 ] );
		localStorage.setItem( `current.mnemonic`, this.mnemonicList[ userId - 1 ] );

		//	create wallet
		this.walletObj = EtherWallet.createWalletFromMnemonic( this.mnemonicList[ userId - 1 ] );
		console.log( `setUser this.walletObj :`, this.walletObj );
	}

	public async asyncLoad( roomId : string ) : Promise<boolean>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const errorRoomId : string | null = VaChatRoomEntityItem.isValidRoomId( roomId );
				if ( null !== errorRoomId )
				{
					return reject( errorRoomId );
				}

				const roomItem : ChatRoomEntityItem | null = await this.clientRoom.queryRoom( roomId );
				if ( ! roomItem )
				{
					return reject( `room not found` );
				}

				console.log( `🌈 asyncLoad roomItem :`, roomItem );

				//
				//	initialize member variables
				//
				this.chatMessageList = [];
				delete this.lastTimestamp[ roomId ];
				this.setState( {
					loading : true,
					roomId : roomItem.roomId,
					roomItem : roomItem,
					messages : [],
				} );
				const _response : any = await this.asyncJoinChatRoom( roomId );

				//	...
				await this._asyncLoadQueueMessage( roomId );
				this._scrollToBottom();

				//	...
				this.setState( {
					loading : false
				} );
				resolve( true );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	public async asyncJoinChatRoom( roomId : string ) : Promise<any>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				this.clientConnect.joinRoom( {
					roomId : roomId
				} as JoinRoomRequest, ( response : any ) : void =>
				{
					console.log( `💎 join room response: `, response );
					resolve( response );
				} );
			}
			catch ( err )
			{
				reject( err );
			}
		});
	}

	private async _asyncLoadQueueMessage( roomId : string ) : Promise<number>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const errorRoomId : string | null = VaChatRoomEntityItem.isValidRoomId( roomId );
				if ( null !== errorRoomId )
				{
					return reject( errorRoomId );
				}

				const startTimestamp = 0;
				let endTimestamp = -1;
				const pageSize = 10;
				let pageNo = 1;

				if ( _.isNumber( this.lastTimestamp[ roomId ] ) )
				{
					endTimestamp = this.lastTimestamp[ roomId ];
					if ( endTimestamp > 1 )
					{
						//	to exclude the current record
						endTimestamp --;
					}
				}

				const pullMessageResponse : PullMessageResponse = await this._asyncPullMessage( roomId, startTimestamp, endTimestamp, pageNo, pageSize );
				console.log( `🍺 pullMessageResponse :`, _.cloneDeep( pullMessageResponse ) );
				if ( ! _.isObject( pullMessageResponse ) ||
					! _.has( pullMessageResponse, 'status' ) ||
					! _.has( pullMessageResponse, 'list' ) )
				{
					return reject( `invalid pullMessageResponse` );
				}
				if ( ! Array.isArray( pullMessageResponse.list ) ||
					0 === pullMessageResponse.list.length )
				{
					return resolve( 0 );
				}

				let changed : number = 0;
				for ( const item of pullMessageResponse.list )
				{
					if ( _.isObject( item ) &&
						_.isObject( item.data ) )
					{
						const chatMessage : SendMessageRequest = item.data;
						if ( _.isObject( chatMessage ) )
						{
							//	decrypted message
							const decryptedMessage : SendMessageRequest = await this._decryptMessage( chatMessage );
							console.log( `🍄 decryptedMessage :`, decryptedMessage );

							changed ++;
							this.chatMessageList.unshift( decryptedMessage.payload );

							//
							//	save the latest key for querying the next
							//
							if ( _.isNumber( decryptedMessage.payload.timestamp ) &&
								decryptedMessage.payload.timestamp > 0 )
							{
								if ( undefined === this.lastTimestamp[ roomId ] ||
									decryptedMessage.payload.timestamp < this.lastTimestamp[ roomId ] )
								{
									//	save the older timestamp
									this.lastTimestamp[ roomId ] = decryptedMessage.payload.timestamp;
								}
							}
						}
					}
				}
				if ( changed > 0 )
				{
					this.setState( { messages : this.chatMessageList } );
				}

				return resolve( changed );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	private async _asyncPullMessage( roomId : string, startTimestamp ? : number, endTimestamp ? : number, pageNo ? : number, pageSize ? : number ) : Promise<PullMessageResponse>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const errorRoomId : string | null = VaChatRoomEntityItem.isValidRoomId( roomId );
				if ( null !== errorRoomId )
				{
					return reject( errorRoomId );
				}

				this.clientConnect.pullMessage( {
					roomId : roomId,
					startTimestamp : _.isNumber( startTimestamp ) ? startTimestamp : 0,
					endTimestamp : _.isNumber( endTimestamp ) ? endTimestamp : -1,
					pagination : {
						pageNo : PageUtil.getSafePageNo( pageNo ),
						pageSize : PageUtil.getSafePageSize( pageSize ),
						order : PaginationOrder.DESC
					}
				} as PullMessageRequest, ( response : PullMessageResponse ) : void =>
				{
					console.log( `🐹 pull data from the specified room and return the response: `, _.cloneDeep( response ) );
					resolve( response );
				} );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	/**
	 *	@param message	{SendMessageRequest}
	 *	@returns {SendMessageRequest}
	 *	@private
	 */
	private _decryptMessage( message : SendMessageRequest ) : Promise<SendMessageRequest>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( ! _.isObject( this.state.roomItem ) || _.isEmpty( this.state.roomItem ) )
				{
					return reject( `room not ready` );
				}
				if ( ! message )
				{
					return reject( `invalid message` );
				}
				if ( ! this.walletObj )
				{
					return reject( `wallet not initialized` );
				}

				console.log( `🌷 this.state.roomItem :`, this.state.roomItem );
				console.log( `🌷 message :`, message );

				if ( this.state.roomItem.chatType !== message.payload.chatType )
				{
					return reject( `room type does not match message type` );
				}

				//	...
				if ( ChatType.PRIVATE === this.state.roomItem.chatType )
				{
					const messageMember : ChatRoomMember = {
						memberType: ChatRoomMemberType.MEMBER,
						wallet: String( message.payload.wallet ).trim().toLowerCase(),
						publicKey : message.payload.publicKey,
						userName: message.payload.fromName,
						userAvatar: message.payload.fromAvatar,
						timestamp : message.payload.timestamp,
					};
					const tryRoomItem : ChatRoomEntityItem = _.cloneDeep( this.state.roomItem );
					tryRoomItem.members[ messageMember.wallet ] = messageMember;

					console.log( `🌷 tryRoomItem :`, tryRoomItem );

					const decryptedBody = await new PrivateMessageCrypto().decryptMessage(
						message.payload.body,
						tryRoomItem,
						this.walletObj.address,
						this.walletObj.privateKey
					);
					console.log( `🌷 decryptedBody :`, decryptedBody );

					if ( _.isString( decryptedBody ) && ! _.isEmpty( decryptedBody ) &&
						_.isString( message.payload.body ) && ! _.isEmpty( message.payload.body ) &&
						decryptedBody !== message.payload.body &&
						message.payload.body.length > decryptedBody.length )
					{
						//	decrypt successfully, tries to save the member
						await this.clientRoom.chatRoomStorageService.putMember( this.state.roomItem.roomId, messageMember );
						const newRoomItem : ChatRoomEntityItem | null = await this.clientRoom.queryRoom( this.state.roomItem.roomId );
						if ( newRoomItem )
						{
							this.setState({
								roomItem : newRoomItem
							});
						}
					}
					message.payload.body = decryptedBody;
				}
				else if ( ChatType.GROUP === this.state.roomItem.chatType )
				{
					message.payload.body = await new GroupMessageCrypto().decryptMessage( message.payload.body, this.state.roomItem, `` );
				}

				resolve( message );
			}
			catch ( err )
			{
				console.error( `🔥 _decryptMessage :`, err );
				resolve( message );
			}
		});
	}


	private _scrollToBottom()
	{
		//this.messagesEnd.scrollIntoView({ behavior: "smooth" });
	}

	private _onChatMessageListScroll( e : any )
	{
		const scrollTop = e.target.scrollTop;
		if ( 0 === scrollTop )
		{
			console.log( `🍄 handleScroll : at top` );
		}
	}

	onClickLoadMore( e : any )
	{
		e.preventDefault();
		if ( null !== VaChatRoomEntityItem.isValidRoomId( this.state.roomId ) )
		{
			throw new Error( `invalid this.state.roomId` );
		}

		this._asyncLoadQueueMessage( this.state.roomId ).then( loaded=>
		{
			//this._scrollToBottom();

		}).catch( err =>
		{
			console.error( err );
		});
	}

	onClickJoinRoom( e : any )
	{
		e.preventDefault();
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
				if ( ! _.isObject( this.state.roomItem ) || _.isEmpty( this.state.roomItem ) )
				{
					return reject( `room not ready` );
				}

				const pinCode = ``;
				const userName = this.userName[ this.state.userId - 1 ];
				const callback : ResponseCallback = ( response : any ) : void =>
				{
					console.log( `🍔 send message response: `, response );
				};
				const publicKey : string | undefined = ( ChatType.PRIVATE === this.state.roomItem.chatType ) ? this.walletObj.publicKey : undefined;
				let chatMessage : ChatMessage = {
					chatType : this.state.roomItem.chatType,
					wallet : this.walletObj.address,
					publicKey : publicKey,
					fromName : userName,
					fromAvatar : `https://www.avatar.com/aaa.jgp`,
					roomId : this.state.roomId,
					body : this.state.value,
					timestamp : new Date().getTime(),
					hash : '',
					sig : '',
				};
				console.log( `will send message: `, chatMessage );

				if ( ChatType.PRIVATE === this.state.roomItem.chatType )
				{
					this.clientConnect.sendPrivateMessage( this.walletObj.privateKey, chatMessage, callback );
				}
				else if ( ChatType.GROUP === this.state.roomItem.chatType )
				{
					this.clientConnect.sendGroupMessage( this.walletObj.privateKey, chatMessage, pinCode, callback );
				}

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
			this._scrollToBottom();

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

	onClickInvitation()
	{
		const childInstance = this.refPopupInvitation.current;
		childInstance.togglePopup( this.state.roomId );
	}
	onClickJoin()
	{
		const childInstance = this.refPopupJoin.current;
		childInstance.togglePopup();
	}


	render()
	{
		return (
			<div>
				<div className="RoomIdDiv sticky-top">
					roomId: { this.state.roomId }
				</div>
				<div className="LoadMreDiv">
					<a onClick={ this.onClickLoadMore } className="LoadMoreButton">Older</a>
				</div>
				<div className="ChatMessageList"
				     style={{ minHeight: '100vh', overflowY: 'scroll' }}
				     onScroll={ this._onChatMessageListScroll }
				>
					{ this.state.messages.map( ( item : any ) =>
						<div key={ item.hash }>
							{ item.fromName } / { new Date( item.timestamp ).toLocaleString() }
							<br/>
							{ item.body }
							<hr/>
						</div>
					) }
				</div>
				<div style={{ height: '30px' }}></div>

				{ this.state.loading &&
				<div className="BarDiv sticky-bottom">Loading, please wait ...</div>
				}
				{ ( ! this.state.loading && '' !== this.state.roomId ) &&
				<div className="BarDiv sticky-bottom">
					{/*<button onClick={ this.onClickJoinRoom }>Join</button>*/}
					{/*&nbsp;*/}
					{/*<button onClick={ this.onClickLeaveRoom }>Leave</button>*/}
					{/*&nbsp;&nbsp;&nbsp;*/}
					<input className="MessageInput"
					       autoFocus
					       placeholder="Say something ..."
					       value={ this.state.value }
					       onKeyDown={ this.onInputKeyDown }
					       onChange={ this.onInputValueChanged }></input>
					&nbsp;
					<button onClick={ this.onClickSendMessage }>Send</button>
					&nbsp;&nbsp;&nbsp;&nbsp;
					<button onClick={ this.onClickInvitation }>Invite</button>
					<PopupInvitation
						ref={this.refPopupInvitation}
					></PopupInvitation>
				</div>
				}
				<div style={{ float:"left", clear: "both" }}
				     ref={(el) => { this.messagesEnd = el; }}>
				</div>
			</div>
		);
	}
}
