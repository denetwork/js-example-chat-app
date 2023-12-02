import React from 'react';
import './App.css';
import { ChatMessageList } from "./components/ChatMessageList/ChatMessageList";
import { RoomList } from "./components/RoomList/RoomList";


export interface AppProps
{
}

export interface AppState
{
	selectedUserId : number;
	selectedServer : string;
}

export const defaultServer = 'localhost:6616';

export class App extends React.Component<AppProps, AppState>
{
	refRoomList : React.RefObject<any>;
	refChatMessageList : React.RefObject<any>;

	constructor( props : any )
	{
		super( props );
		this.state = {
			selectedUserId : 1,
			selectedServer : this.loadServerAddress(),
		};

		//	...
		this.refRoomList = React.createRef();
		this.refChatMessageList = React.createRef();

		//	...
		this.onSwitchRoom = this.onSwitchRoom.bind( this );
		this.onSelectServerChanged = this.onSelectServerChanged.bind( this );
		this.onSelectUserChanged = this.onSelectUserChanged.bind( this );
	}

	componentDidMount()
	{
		this.initSelectedServer();
		this.initSelectedUser();
	}


	public loadServerAddress() : string
	{
		return localStorage.getItem( `current.server` ) || defaultServer;
	}
	private initSelectedServer()
	{
		let server : string = this.loadServerAddress();

		console.log( `initSelectedServer server :`, server );
		this.setState({
			selectedServer : server,
		});
	}

	private initSelectedUser()
	{
		let userIdString : string | null = localStorage.getItem( `current.userId` ) || '1';
		const userId : number = parseInt( userIdString );

		console.log( `initSelectedUser userId :`, userId );
		this.setState({
			selectedUserId : userId,
		});
	}

	onSwitchRoom( roomId : string )
	{
		console.log( `App::onRoomChanged :`, roomId );

		const childInstance = this.refChatMessageList.current;
		childInstance.asyncLoad( roomId ).then( ( res : boolean ) =>
		{
			console.log( `App::onRoomChanged ChatMessageList.asyncLoad :`, res );
		}).catch( ( err : any ) =>
		{
			console.error( `App::onRoomChanged err: `, err );
		})
	}

	onSelectServerChanged( e : any )
	{
		const server : string = String( e.target.value );
		this.setState({
			selectedServer : server,
		});

		//	save to localStorage
		localStorage.setItem( `current.server`, server );

		setTimeout( () =>
		{
			window.location.reload();

		}, 300 );
	}

	onSelectUserChanged( e : any )
	{
		const userId : number = parseInt( e.target.value );
		this.setState({
			selectedUserId : userId,
		});

		//	...
		const childChatMessageList = this.refChatMessageList.current;
		childChatMessageList.setUser( userId );

		setTimeout( () =>
		{
			//	...
			const childRoomList = this.refRoomList.current;
			childRoomList.loadRooms();

		}, 300 );
	}


	render()
	{
		return (
			<div className="App">
				<div className="App-header sticky-top">
					<div className="serverDiv">
						<select value={ this.state.selectedServer } onChange={ this.onSelectServerChanged } >
							<option value={ defaultServer }>{ defaultServer }</option>
							<option value="8.140.247.159:6616">8.140.247.159:6616</option>
						</select>
					</div>
					<div className="userDiv">
						I am : &nbsp;
						<select value={ this.state.selectedUserId } onChange={ this.onSelectUserChanged } >
							<option value={1}>Alice</option>
							<option value={2}>Bob</option>
							<option value={3}>Mary</option>
						</select>
					</div>
				</div>
				<div className="App-body">
					<div className="RoomColumn">
						<RoomList
							ref={this.refRoomList}
							callbackOnRoomChanged={ this.onSwitchRoom }
						/>
					</div>
					<div className="ChatColumn">
						<ChatMessageList
							ref={this.refChatMessageList}
							serverUrl={ this.state.selectedServer }
						/>
					</div>
				</div>
			</div>
		);
	}
}
