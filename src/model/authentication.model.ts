export interface authenticationRequest {
    username: string,
    password: string
}

export interface authenticationResponse {
    isAuthenticated: boolean
}