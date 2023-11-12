import { ChatRoomMemberType, ChatType, ClientRoom } from "denetwork-chat-client";
import React from "react";
import { ChatRoomEntityItem } from "denetwork-chat-client/dist/entities/ChatRoomEntity";
import { PopupCreateRoom } from "../PopupCreateRoom/PopupCreateRoom";
import { CreateChatRoom } from "denetwork-chat-client/dist/models/rooms/CreateChatRoom";
import { EtherWallet } from "web3id";
import classnames from "classnames";
import "./RoomList.css";
import _ from "lodash";

export interface ChatRoomListProps
{
	callbackOnRoomChanged : ( roomId : string ) => void;
}

export interface ChatRoomListState
{
	loading : boolean;
	showPopupCreateRoom : boolean;
	rooms : Array<ChatRoomEntityItem>
	currentRoomId : string;
}

/**
 * 	@class
 */
export class RoomList extends React.Component<ChatRoomListProps, ChatRoomListState>
{
	initialized : boolean = false;
	clientRoom !: ClientRoom;
	refPopupCreateRoom : React.RefObject<any>;


	constructor( props : any )
	{
		if ( ! _.isFunction( props.callbackOnRoomChanged ) )
		{
			throw new Error( `invalid props.callbackOnRoomChanged` );
		}

		super( props );
		this.state = {
			loading : true,
			showPopupCreateRoom : false,
			rooms : [],
			currentRoomId : '',
		};

		this.clientRoom = new ClientRoom();
		this.refPopupCreateRoom = React.createRef();
		this.onClickCreateRoom = this.onClickCreateRoom.bind( this );
		this.callbackPopupCreateRoom = this.callbackPopupCreateRoom.bind( this );
		this.onClickRoomItem = this.onClickRoomItem.bind( this );
	}

	componentDidUpdate()
	{
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
		this._asyncLoadRooms().then( _res =>
		{
			setTimeout( () =>
			{
				this.setState( { loading : false } );

			}, 1000 );
		} ).catch( _err =>
		{
			setTimeout( () =>
			{
				this.setState( { loading : false } );

			}, 1000 );
		} );
	}

	private _asyncLoadRooms()
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				const rooms : Array<ChatRoomEntityItem> = await this.clientRoom.queryRooms();
				console.log( `rooms :`, rooms );
				this.setState({
					rooms : rooms,
				});

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

	onClickRoomItem( roomId : string )
	{
		console.log( `clicked :`, roomId );
		this.setState({
			currentRoomId : roomId
		});
		this.props.callbackOnRoomChanged( roomId );
	}


	render()
	{
		return (
		<div className="RoomListDiv">
			<div className="titleBar sticky-top">Room List</div>
			<div className="panel">
				{ this.state.loading ? (
					<div>Loading ...</div>
				) : (
					<div>
						<button onClick={ this.onClickCreateRoom }>Create room</button>
						<PopupCreateRoom
							ref={this.refPopupCreateRoom}
							callback={ this.callbackPopupCreateRoom }
						></PopupCreateRoom>
					</div>
				) }
			</div>
			<div className="listContainer">
				{ this.state.rooms.map( ( item : ChatRoomEntityItem ) =>
				<div key={ item.roomId }
				     data-id={ item.roomId }
				     className={ classnames( 'roomItem', { 'selected' : this.state.currentRoomId === item.roomId } ) }
				     onClick={ ( _e ) => { this.onClickRoomItem( item.roomId ); } }>
					<div className="roomName">
						{ ChatType.PRIVATE === item.chatType ? '私聊' : '群聊' }
						/
						{ item.name }({ Object.keys( item.members ).length })</div>
					<div className="roomId">{ item.roomId }</div>
					<div className="roomCreatedTime">{ new Date( item.timestamp ).toLocaleString() }</div>
				</div>
				) }
			</div>
		</div>
		);
	}
}
