import { ChatRoomMemberType, ClientRoom, ResponseCallback } from "denetwork-chat-client";
import React from "react";
import { ChatRoomEntityItem } from "denetwork-chat-client/dist/entities/ChatRoomEntity";
import { PopupComponent } from "./components/PopupComponent/PopupComponent";
import { PopupCreateRoom, PopupCreateRoomCallback } from "./components/PopupCreateRoom/PopupCreateRoom";
import { CreateChatRoom } from "denetwork-chat-client/dist/models/rooms/CreateChatRoom";
import { EtherWallet } from "web3id";

export interface ChatRoomListProps
{
}

export interface ChatRoomListState
{
	loading : boolean;
	showPopupCreateRoom : boolean;
	rooms : Array<ChatRoomEntityItem>
}

/**
 * 	@class
 */
export class RoomList extends React.Component<ChatRoomListProps, ChatRoomListState>
{
	initialized : boolean = false;
	messagesEnd : any = null;
	clientRoom !: ClientRoom;
	refPopupCreateRoom : React.RefObject<any>;


	constructor( props : any )
	{
		super( props );
		this.state = {
			loading : true,
			showPopupCreateRoom : false,
			rooms : [],
		};

		this.clientRoom = new ClientRoom();
		this.refPopupCreateRoom = React.createRef();
		this.onClickCreateRoom = this.onClickCreateRoom.bind( this );
		this.callbackPopupCreateRoom = this.callbackPopupCreateRoom.bind( this );
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
		this._asyncLoadRooms().then( res =>
		{
			this._scrollToBottom();
			setTimeout( () =>
			{
				this.setState( { loading : false } );

			}, 1000 );
		} ).catch( err =>
		{
			setTimeout( () =>
			{
				this.setState( { loading : false } );

			}, 1000 );
		} );
	}

	private _scrollToBottom()
	{
		this.messagesEnd.scrollIntoView( { behavior : "smooth" } );
	}

	private _asyncLoadRooms()
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const rooms : Array<ChatRoomEntityItem> = await this.clientRoom.queryRooms();
				console.log( `rooms :`, rooms );

				//	...
				resolve( true );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	onClickCreateRoom()
	{
		const childInstance = this.refPopupCreateRoom.current;
		childInstance.togglePopupCreateRoom();
	}
	callbackPopupCreateRoom( data : any )
	{
		console.log( `callbackPopupCreateRoom :`, data );
		const BobWalletObj = EtherWallet.createWalletFromMnemonic();
		BobWalletObj.address = BobWalletObj.address.trim().toLowerCase();
		const createChatRoomOptions: CreateChatRoom = {
			chatType : data.chatType,
			name : data.name,
			members : {
				[ BobWalletObj.address ] : {
					memberType : ChatRoomMemberType.OWNER,
					wallet : BobWalletObj.address,
					publicKey : BobWalletObj.publicKey,
					userName : 'Bob',
					userAvatar : 'https://www.aaa/avatar.png',
					timestamp : new Date().getTime()
				}
			}
		};
		this.clientRoom.createRoom( createChatRoomOptions ).then( response =>
		{
			console.log( `callbackPopupCreateRoom response :`, response );

		}).catch( err =>
		{
			console.log( err );
		});
	}


	render()
	{
		return (
			<div className="RoomListDiv">
				<div className="titleBar sticky-top">Room List</div>
				<div className="listContainer">
					{ this.state.loading ? (
						<div>Loading ...</div>
					) : (
						<div></div>
					) }

					<button onClick={ this.onClickCreateRoom }>Create room</button>
					<PopupCreateRoom
						ref={this.refPopupCreateRoom}
						callback={ this.callbackPopupCreateRoom }
					></PopupCreateRoom>

					<div style={ { float : "left", clear : "both" } }
					     ref={ ( el ) =>
					     {
						     this.messagesEnd = el;
					     } }>
					</div>
				</div>
			</div>
		);
	}
}
