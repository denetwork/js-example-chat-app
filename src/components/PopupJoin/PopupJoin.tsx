import React, { Component } from "react";
import { PopupComponent } from "../PopupComponent/PopupComponent";
import "./PopupJoin.css";
import { ClientRoom, InviteRequest, VaChatRoomEntityItem } from "denetwork-chat-client";
import { ChatRoomEntityItem } from "denetwork-chat-client/dist/entities/ChatRoomEntity";


export interface PopupJoinProps
{
}

export interface PopupJoinState
{
	showPopup : boolean;
	textareaValue : string;
}

export class PopupJoin extends Component<PopupJoinProps, PopupJoinState>
{
	clientRoom : ClientRoom = new ClientRoom();
	refTextarea : React.RefObject<any>;

	constructor( props : any )
	{
		super( props );
		this.state = {
			showPopup : false,
			textareaValue : '',
		};

		//	...
		this.refTextarea = React.createRef();

		//	...
		this.togglePopup = this.togglePopup.bind( this );
		this.onClickSaveJoin = this.onClickSaveJoin.bind( this );
	}

	public togglePopup()
	{
		this.setState( {
			showPopup : ! this.state.showPopup,
		} );
	}

	private asyncCreateInvitation( roomId : string ) : Promise<InviteRequest>
	{
		return new Promise( async ( resolve, reject ) =>
		{
			try
			{
				if ( null !== VaChatRoomEntityItem.isValidRoomId( roomId ) )
				{
					return reject( `invalid roomId` );
				}

				const inviteRequest : InviteRequest | null = await this.clientRoom.inviteMember( roomId );
				if ( null === inviteRequest )
				{
					return reject( `failed to create invitation` );
				}

				//	...
				resolve( inviteRequest );
			}
			catch ( err )
			{
				reject( err );
			}
		} );
	}

	onClickSaveJoin()
	{
		const inviteString : string = this.refTextarea.current.value;
		this.clientRoom.acceptInvitation( inviteString ).then( ( chatRoomEntityItem : ChatRoomEntityItem ) =>
		{
			console.log( `chatRoomEntityItem :`, chatRoomEntityItem );
			window.alert( `Joined room ${ chatRoomEntityItem.name }` );
		})
		.catch( err =>
		{
			console.error( err );
			window.alert( `error in data format` );
		});



		// console.log( `🌼 show : ${ this.state.showPopup }, will create invitation for roomId : ${ roomId }` );
		// if ( roomId && null === VaChatRoomEntityItem.isValidRoomId( roomId ) )
		// {
		// 	this.asyncCreateInvitation( roomId ).then( ( res : InviteRequest ) =>
		// 	{
		// 		const json : string = JSON.stringify( res );
		// 		this.setState( {
		// 			textareaValue : json
		// 		} );
		//
		// 	} ).catch( err =>
		// 	{
		// 		console.error( err );
		// 	} );
		// }
	}

	render()
	{
		return (
			<div className="container">
				{ this.state.showPopup &&
					<PopupComponent onClose={ this.togglePopup }>
						<div className="titleDiv">Join a Room</div>
						<div className="textAreaDiv">
							<textarea
								ref={ this.refTextarea }
								defaultValue={ this.state.textareaValue }></textarea>
						</div>
						<div className="bottomPanel">
							<button className="optButton"
								onClick={ this.onClickSaveJoin }>Join
							</button>
						</div>
					</PopupComponent>
				}
			</div>
		);
	}
}
