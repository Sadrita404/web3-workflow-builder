export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  icon: string;
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: 'simple-token',
    name: 'Simple Token',
    description: 'Custom ERC20-like token without libraries',
    category: 'Token',
    icon: '🪙',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        require(_spender != address(0), "Invalid address");

        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    function mint(address _to, uint256 _amount) public onlyOwner returns (bool success) {
        require(_to != address(0), "Invalid address");

        totalSupply += _amount;
        balanceOf[_to] += _amount;

        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    function burn(uint256 _amount) public returns (bool success) {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");

        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;

        emit Burn(msg.sender, _amount);
        emit Transfer(msg.sender, address(0), _amount);
        return true;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}`
  },
  {
    id: 'simple-nft',
    name: 'Simple NFT',
    description: 'Custom ERC721-like NFT without libraries',
    category: 'NFT',
    icon: '🎭',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleNFT {
    string public name;
    string public symbol;
    address public owner;
    uint256 private _tokenIdCounter;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    mapping(uint256 => string) public tokenURI;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
    }

    function mint(address _to, string memory _tokenURI) public onlyOwner returns (uint256) {
        require(_to != address(0), "Invalid address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        ownerOf[tokenId] = _to;
        balanceOf[_to]++;
        tokenURI[tokenId] = _tokenURI;

        emit Transfer(address(0), _to, tokenId);
        return tokenId;
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public {
        require(_to != address(0), "Invalid address");
        require(ownerOf[_tokenId] == _from, "Not the owner");
        require(
            msg.sender == _from ||
            getApproved[_tokenId] == msg.sender ||
            isApprovedForAll[_from][msg.sender],
            "Not authorized"
        );

        balanceOf[_from]--;
        balanceOf[_to]++;
        ownerOf[_tokenId] = _to;
        delete getApproved[_tokenId];

        emit Transfer(_from, _to, _tokenId);
    }

    function approve(address _approved, uint256 _tokenId) public {
        address tokenOwner = ownerOf[_tokenId];
        require(msg.sender == tokenOwner || isApprovedForAll[tokenOwner][msg.sender], "Not authorized");

        getApproved[_tokenId] = _approved;
        emit Approval(tokenOwner, _approved, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) public {
        require(_operator != msg.sender, "Cannot approve yourself");
        isApprovedForAll[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) public {
        transferFrom(_from, _to, _tokenId);
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    function burn(uint256 _tokenId) public {
        require(ownerOf[_tokenId] == msg.sender, "Not the owner");

        balanceOf[msg.sender]--;
        delete ownerOf[_tokenId];
        delete getApproved[_tokenId];
        delete tokenURI[_tokenId];

        emit Transfer(msg.sender, address(0), _tokenId);
    }
}`
  },
  {
    id: 'crowdfunding',
    name: 'Crowdfunding',
    description: 'Campaign-based crowdfunding platform',
    category: 'DeFi',
    icon: '💸',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Crowdfunding {
    struct Campaign {
        address creator;
        string title;
        string description;
        uint256 goal;
        uint256 pledged;
        uint256 startAt;
        uint256 endAt;
        bool claimed;
        bool cancelled;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public pledgedAmount;

    event CampaignCreated(uint256 indexed id, address indexed creator, uint256 goal, uint256 startAt, uint256 endAt);
    event Pledged(uint256 indexed id, address indexed backer, uint256 amount);
    event Unpledged(uint256 indexed id, address indexed backer, uint256 amount);
    event Claimed(uint256 indexed id, uint256 amount);
    event Refunded(uint256 indexed id, address indexed backer, uint256 amount);
    event Cancelled(uint256 indexed id);

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _startAt,
        uint256 _endAt
    ) external returns (uint256) {
        require(_startAt >= block.timestamp, "Start time is in the past");
        require(_endAt > _startAt, "End time must be after start time");
        require(_endAt <= _startAt + 90 days, "Campaign too long");
        require(_goal > 0, "Goal must be greater than 0");

        uint256 id = campaignCount;
        campaignCount++;

        campaigns[id] = Campaign({
            creator: msg.sender,
            title: _title,
            description: _description,
            goal: _goal,
            pledged: 0,
            startAt: _startAt,
            endAt: _endAt,
            claimed: false,
            cancelled: false
        });

        emit CampaignCreated(id, msg.sender, _goal, _startAt, _endAt);
        return id;
    }

    function pledge(uint256 _id) external payable {
        Campaign storage campaign = campaigns[_id];
        require(block.timestamp >= campaign.startAt, "Campaign not started");
        require(block.timestamp <= campaign.endAt, "Campaign ended");
        require(!campaign.cancelled, "Campaign cancelled");
        require(msg.value > 0, "Must pledge some amount");

        campaign.pledged += msg.value;
        pledgedAmount[_id][msg.sender] += msg.value;

        emit Pledged(_id, msg.sender, msg.value);
    }

    function unpledge(uint256 _id, uint256 _amount) external {
        Campaign storage campaign = campaigns[_id];
        require(block.timestamp <= campaign.endAt, "Campaign ended");
        require(!campaign.cancelled, "Campaign cancelled");
        require(pledgedAmount[_id][msg.sender] >= _amount, "Insufficient pledged amount");

        campaign.pledged -= _amount;
        pledgedAmount[_id][msg.sender] -= _amount;

        payable(msg.sender).transfer(_amount);

        emit Unpledged(_id, msg.sender, _amount);
    }

    function claim(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        require(msg.sender == campaign.creator, "Not campaign creator");
        require(block.timestamp > campaign.endAt, "Campaign not ended");
        require(campaign.pledged >= campaign.goal, "Goal not reached");
        require(!campaign.claimed, "Already claimed");
        require(!campaign.cancelled, "Campaign cancelled");

        campaign.claimed = true;
        payable(campaign.creator).transfer(campaign.pledged);

        emit Claimed(_id, campaign.pledged);
    }

    function refund(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        require(block.timestamp > campaign.endAt, "Campaign not ended");
        require(campaign.pledged < campaign.goal, "Goal was reached");
        require(!campaign.cancelled, "Use cancel function instead");

        uint256 amount = pledgedAmount[_id][msg.sender];
        require(amount > 0, "No pledge to refund");

        pledgedAmount[_id][msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit Refunded(_id, msg.sender, amount);
    }

    function cancel(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        require(msg.sender == campaign.creator, "Not campaign creator");
        require(block.timestamp < campaign.startAt, "Campaign already started");
        require(!campaign.cancelled, "Already cancelled");

        campaign.cancelled = true;
        emit Cancelled(_id);
    }

    function getCampaignDetails(uint256 _id) external view returns (
        address creator,
        string memory title,
        string memory description,
        uint256 goal,
        uint256 pledged,
        uint256 startAt,
        uint256 endAt,
        bool claimed,
        bool cancelled
    ) {
        Campaign storage campaign = campaigns[_id];
        return (
            campaign.creator,
            campaign.title,
            campaign.description,
            campaign.goal,
            campaign.pledged,
            campaign.startAt,
            campaign.endAt,
            campaign.claimed,
            campaign.cancelled
        );
    }
}`
  },
  {
    id: 'multisig-wallet',
    name: 'MultiSig Wallet',
    description: 'Multi-signature wallet for secure transactions',
    category: 'Security',
    icon: '🔐',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(address indexed owner, uint256 indexed txIndex, address indexed to, uint256 value, bytes data);
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public numConfirmationsRequired;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
    }

    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    Transaction[] public transactions;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "Transaction already confirmed");
        _;
    }

    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) {
        require(_owners.length > 0, "Owners required");
        require(
            _numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length,
            "Invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(address _to, uint256 _value, bytes memory _data) public onlyOwner {
        uint256 txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "Not enough confirmations"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(isConfirmed[_txIndex][msg.sender], "Transaction not confirmed");

        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 _txIndex)
        public
        view
        returns (address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations)
    {
        Transaction storage transaction = transactions[_txIndex];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
}`
  },
  {
    id: 'voting',
    name: 'Voting System',
    description: 'Decentralized voting and governance',
    category: 'Governance',
    icon: '🗳️',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingSystem {
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        bool exists;
    }

    struct Voter {
        bool isRegistered;
        uint256 votingPower;
    }

    address public admin;
    uint256 public proposalCount;
    uint256 public voterCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(address => Voter) public voters;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public voteChoice;

    event VoterRegistered(address indexed voter, uint256 votingPower);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 votingPower);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegistered() {
        require(voters[msg.sender].isRegistered, "Not a registered voter");
        _;
    }

    constructor() {
        admin = msg.sender;
        voters[admin].isRegistered = true;
        voters[admin].votingPower = 1;
        voterCount = 1;
    }

    function registerVoter(address _voter, uint256 _votingPower) external onlyAdmin {
        require(!voters[_voter].isRegistered, "Voter already registered");
        require(_votingPower > 0, "Voting power must be greater than 0");

        voters[_voter].isRegistered = true;
        voters[_voter].votingPower = _votingPower;
        voterCount++;

        emit VoterRegistered(_voter, _votingPower);
    }

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _durationInDays
    ) external onlyRegistered returns (uint256) {
        require(_durationInDays > 0 && _durationInDays <= 90, "Invalid duration");

        uint256 proposalId = proposalCount;
        proposalCount++;

        proposals[proposalId] = Proposal({
            id: proposalId,
            title: _title,
            description: _description,
            proposer: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + (_durationInDays * 1 days),
            yesVotes: 0,
            noVotes: 0,
            executed: false,
            exists: true
        });

        emit ProposalCreated(proposalId, msg.sender, _title);
        return proposalId;
    }

    function vote(uint256 _proposalId, bool _support) external onlyRegistered {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "Proposal does not exist");
        require(block.timestamp >= proposal.startTime, "Voting has not started");
        require(block.timestamp <= proposal.endTime, "Voting has ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        uint256 votingPower = voters[msg.sender].votingPower;
        hasVoted[_proposalId][msg.sender] = true;
        voteChoice[_proposalId][msg.sender] = _support;

        if (_support) {
            proposal.yesVotes += votingPower;
        } else {
            proposal.noVotes += votingPower;
        }

        emit Voted(_proposalId, msg.sender, _support, votingPower);
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "Proposal does not exist");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");

        proposal.executed = true;
        bool passed = proposal.yesVotes > proposal.noVotes;

        emit ProposalExecuted(_proposalId, passed);
    }

    function getProposalStatus(uint256 _proposalId) external view returns (
        string memory title,
        uint256 yesVotes,
        uint256 noVotes,
        bool isActive,
        bool executed,
        bool passed
    ) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "Proposal does not exist");

        bool active = block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime;
        bool result = proposal.yesVotes > proposal.noVotes;

        return (
            proposal.title,
            proposal.yesVotes,
            proposal.noVotes,
            active,
            proposal.executed,
            result
        );
    }

    function getVoterInfo(address _voter) external view returns (bool isRegistered, uint256 votingPower) {
        Voter storage voter = voters[_voter];
        return (voter.isRegistered, voter.votingPower);
    }

    function hasVotedOnProposal(uint256 _proposalId, address _voter) external view returns (bool) {
        return hasVoted[_proposalId][_voter];
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
    }
}`
  },
  {
    id: 'escrow',
    name: 'Escrow Service',
    description: 'Secure escrow for transactions',
    category: 'DeFi',
    icon: '🤝',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EscrowService {
    enum State { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, REFUNDED, DISPUTED }

    struct Escrow {
        uint256 id;
        address payable buyer;
        address payable seller;
        address arbiter;
        uint256 amount;
        State state;
        uint256 createdAt;
        uint256 deliveryDeadline;
        bool exists;
    }

    uint256 public escrowCount;
    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(uint256 indexed id, address indexed buyer, address indexed seller, uint256 amount);
    event PaymentDeposited(uint256 indexed id, uint256 amount);
    event DeliveryConfirmed(uint256 indexed id);
    event PaymentReleased(uint256 indexed id, address indexed seller, uint256 amount);
    event RefundIssued(uint256 indexed id, address indexed buyer, uint256 amount);
    event DisputeRaised(uint256 indexed id);
    event DisputeResolved(uint256 indexed id, bool buyerWins);

    modifier onlyBuyer(uint256 _id) {
        require(msg.sender == escrows[_id].buyer, "Only buyer can perform this action");
        _;
    }

    modifier onlySeller(uint256 _id) {
        require(msg.sender == escrows[_id].seller, "Only seller can perform this action");
        _;
    }

    modifier onlyArbiter(uint256 _id) {
        require(msg.sender == escrows[_id].arbiter, "Only arbiter can perform this action");
        _;
    }

    modifier inState(uint256 _id, State _state) {
        require(escrows[_id].state == _state, "Invalid state for this action");
        _;
    }

    function createEscrow(
        address payable _seller,
        address _arbiter,
        uint256 _deliveryDeadlineDays
    ) external payable returns (uint256) {
        require(_seller != address(0), "Invalid seller address");
        require(_arbiter != address(0), "Invalid arbiter address");
        require(msg.value > 0, "Must deposit funds");
        require(_deliveryDeadlineDays > 0, "Invalid deadline");

        uint256 id = escrowCount;
        escrowCount++;

        escrows[id] = Escrow({
            id: id,
            buyer: payable(msg.sender),
            seller: _seller,
            arbiter: _arbiter,
            amount: msg.value,
            state: State.AWAITING_DELIVERY,
            createdAt: block.timestamp,
            deliveryDeadline: block.timestamp + (_deliveryDeadlineDays * 1 days),
            exists: true
        });

        emit EscrowCreated(id, msg.sender, _seller, msg.value);
        emit PaymentDeposited(id, msg.value);

        return id;
    }

    function confirmDelivery(uint256 _id)
        external
        onlyBuyer(_id)
        inState(_id, State.AWAITING_DELIVERY)
    {
        Escrow storage escrow = escrows[_id];
        escrow.state = State.COMPLETE;

        escrow.seller.transfer(escrow.amount);

        emit DeliveryConfirmed(_id);
        emit PaymentReleased(_id, escrow.seller, escrow.amount);
    }

    function raiseDispute(uint256 _id)
        external
        inState(_id, State.AWAITING_DELIVERY)
    {
        require(
            msg.sender == escrows[_id].buyer || msg.sender == escrows[_id].seller,
            "Only buyer or seller can raise dispute"
        );

        escrows[_id].state = State.DISPUTED;
        emit DisputeRaised(_id);
    }

    function resolveDispute(uint256 _id, bool _buyerWins)
        external
        onlyArbiter(_id)
        inState(_id, State.DISPUTED)
    {
        Escrow storage escrow = escrows[_id];

        if (_buyerWins) {
            escrow.state = State.REFUNDED;
            escrow.buyer.transfer(escrow.amount);
            emit RefundIssued(_id, escrow.buyer, escrow.amount);
        } else {
            escrow.state = State.COMPLETE;
            escrow.seller.transfer(escrow.amount);
            emit PaymentReleased(_id, escrow.seller, escrow.amount);
        }

        emit DisputeResolved(_id, _buyerWins);
    }

    function requestRefund(uint256 _id)
        external
        onlyBuyer(_id)
        inState(_id, State.AWAITING_DELIVERY)
    {
        Escrow storage escrow = escrows[_id];
        require(block.timestamp > escrow.deliveryDeadline, "Delivery deadline not passed");

        escrow.state = State.REFUNDED;
        escrow.buyer.transfer(escrow.amount);

        emit RefundIssued(_id, escrow.buyer, escrow.amount);
    }

    function getEscrowDetails(uint256 _id) external view returns (
        address buyer,
        address seller,
        address arbiter,
        uint256 amount,
        State state,
        uint256 createdAt,
        uint256 deliveryDeadline
    ) {
        Escrow storage escrow = escrows[_id];
        require(escrow.exists, "Escrow does not exist");

        return (
            escrow.buyer,
            escrow.seller,
            escrow.arbiter,
            escrow.amount,
            escrow.state,
            escrow.createdAt,
            escrow.deliveryDeadline
        );
    }

    function getEscrowState(uint256 _id) external view returns (State) {
        require(escrows[_id].exists, "Escrow does not exist");
        return escrows[_id].state;
    }
}`
  },
  {
    id: 'staking',
    name: 'Token Staking',
    description: 'Stake tokens and earn rewards over time',
    category: 'DeFi',
    icon: '🔒',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TokenStaking {
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    address public owner;

    uint256 public rewardRate = 100; // Reward tokens per second per staked token
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public totalStaked;

    struct StakerInfo {
        uint256 stakedAmount;
        uint256 rewardPerTokenPaid;
        uint256 rewards;
    }

    mapping(address => StakerInfo) public stakers;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
            stakers[account].rewards = earned(account);
            stakers[account].rewardPerTokenPaid = rewardPerTokenStored;
        }
        _;
    }

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        owner = msg.sender;
        lastUpdateTime = block.timestamp;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked);
    }

    function earned(address account) public view returns (uint256) {
        return ((stakers[account].stakedAmount *
            (rewardPerToken() - stakers[account].rewardPerTokenPaid)) / 1e18) +
            stakers[account].rewards;
    }

    function stake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");

        totalStaked += amount;
        stakers[msg.sender].stakedAmount += amount;

        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(stakers[msg.sender].stakedAmount >= amount, "Insufficient staked amount");

        totalStaked -= amount;
        stakers[msg.sender].stakedAmount -= amount;

        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() public updateReward(msg.sender) {
        uint256 reward = stakers[msg.sender].rewards;
        require(reward > 0, "No rewards to claim");

        stakers[msg.sender].rewards = 0;
        require(rewardToken.transfer(msg.sender, reward), "Transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    function exit() external {
        withdraw(stakers[msg.sender].stakedAmount);
        claimReward();
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner updateReward(address(0)) {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    function getStakerInfo(address account) external view returns (
        uint256 stakedAmount,
        uint256 earnedRewards
    ) {
        return (
            stakers[account].stakedAmount,
            earned(account)
        );
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}`
  },
  {
    id: 'airdrop',
    name: 'Token Airdrop',
    description: 'Distribute tokens to multiple addresses',
    category: 'Distribution',
    icon: '🎁',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TokenAirdrop {
    IERC20 public token;
    address public owner;

    mapping(address => uint256) public claimableAmount;
    mapping(address => bool) public hasClaimed;

    uint256 public totalAirdropped;
    uint256 public totalClaimed;
    bool public airdropActive;

    event AirdropConfigured(address[] recipients, uint256[] amounts);
    event TokensClaimed(address indexed user, uint256 amount);
    event AirdropStatusChanged(bool active);
    event TokensWithdrawn(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
        airdropActive = false;
    }

    function configureAirdrop(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length > 0, "Empty arrays");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid address");
            require(amounts[i] > 0, "Amount must be greater than 0");

            if (claimableAmount[recipients[i]] == 0 || !hasClaimed[recipients[i]]) {
                totalAirdropped += amounts[i];
            }

            claimableAmount[recipients[i]] = amounts[i];
            hasClaimed[recipients[i]] = false;
        }

        emit AirdropConfigured(recipients, amounts);
    }

    function claim() external {
        require(airdropActive, "Airdrop not active");
        require(!hasClaimed[msg.sender], "Already claimed");
        require(claimableAmount[msg.sender] > 0, "No tokens to claim");

        uint256 amount = claimableAmount[msg.sender];
        hasClaimed[msg.sender] = true;
        totalClaimed += amount;

        require(token.transfer(msg.sender, amount), "Transfer failed");

        emit TokensClaimed(msg.sender, amount);
    }

    function setAirdropStatus(bool _active) external onlyOwner {
        airdropActive = _active;
        emit AirdropStatusChanged(_active);
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance");

        require(token.transfer(owner, amount), "Transfer failed");

        emit TokensWithdrawn(owner, amount);
    }

    function checkEligibility(address user) external view returns (
        bool eligible,
        uint256 amount,
        bool claimed
    ) {
        return (
            claimableAmount[user] > 0,
            claimableAmount[user],
            hasClaimed[user]
        );
    }

    function getAirdropStats() external view returns (
        uint256 _totalAirdropped,
        uint256 _totalClaimed,
        uint256 remaining,
        bool active
    ) {
        return (
            totalAirdropped,
            totalClaimed,
            totalAirdropped - totalClaimed,
            airdropActive
        );
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}`
  },
  {
    id: 'nft-marketplace',
    name: 'NFT Marketplace',
    description: 'Buy and sell NFTs with custom pricing',
    category: 'NFT',
    icon: '🛒',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract NFTMarketplace {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    uint256 public listingCount;
    uint256 public feePercentage = 250; // 2.5% fee (250/10000)
    address public owner;
    uint256 public totalFeesCollected;

    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(uint256 => uint256)) public nftToListing;

    event NFTListed(uint256 indexed listingId, address indexed seller, address nftContract, uint256 tokenId, uint256 price);
    event NFTSold(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 newPrice);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external returns (uint256) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(price > 0, "Price must be greater than 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not the NFT owner");

        uint256 listingId = listingCount;
        listingCount++;

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        nftToListing[nftContract][tokenId] = listingId;

        emit NFTListed(listingId, msg.sender, nftContract, tokenId, price);
        return listingId;
    }

    function buyNFT(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own NFT");

        listing.active = false;

        uint256 fee = (listing.price * feePercentage) / 10000;
        uint256 sellerAmount = listing.price - fee;

        totalFeesCollected += fee;

        // Transfer NFT to buyer
        IERC721(listing.nftContract).transferFrom(listing.seller, msg.sender, listing.tokenId);

        // Pay seller
        payable(listing.seller).transfer(sellerAmount);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit NFTSold(listingId, msg.sender, listing.seller, listing.price);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.sender == listing.seller, "Not the seller");

        listing.active = false;

        emit ListingCancelled(listingId);
    }

    function updatePrice(uint256 listingId, uint256 newPrice) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.sender == listing.seller, "Not the seller");
        require(newPrice > 0, "Price must be greater than 0");

        listing.price = newPrice;

        emit PriceUpdated(listingId, newPrice);
    }

    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        feePercentage = _feePercentage;
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        require(amount > 0, "No fees to withdraw");

        totalFeesCollected = 0;
        payable(owner).transfer(amount);

        emit FeesWithdrawn(owner, amount);
    }

    function getListing(uint256 listingId) external view returns (
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        bool active
    ) {
        Listing storage listing = listings[listingId];
        return (
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.price,
            listing.active
        );
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}`
  },
  {
    id: 'lottery',
    name: 'Lottery System',
    description: 'Decentralized lottery with random winner selection',
    category: 'Gaming',
    icon: '🎰',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LotterySystem {
    address public owner;
    uint256 public ticketPrice;
    uint256 public lotteryId;
    uint256 public maxTicketsPerUser = 10;

    struct Lottery {
        uint256 id;
        uint256 totalPool;
        uint256 endTime;
        address winner;
        bool completed;
        uint256 ticketCount;
    }

    mapping(uint256 => Lottery) public lotteries;
    mapping(uint256 => address[]) public lotteryParticipants;
    mapping(uint256 => mapping(address => uint256)) public userTickets;

    event LotteryCreated(uint256 indexed lotteryId, uint256 ticketPrice, uint256 endTime);
    event TicketPurchased(uint256 indexed lotteryId, address indexed buyer, uint256 ticketCount);
    event WinnerSelected(uint256 indexed lotteryId, address indexed winner, uint256 prize);
    event PrizeWithdrawn(uint256 indexed lotteryId, address indexed winner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(uint256 _ticketPrice) {
        owner = msg.sender;
        ticketPrice = _ticketPrice;
    }

    function createLottery(uint256 durationInHours) external onlyOwner {
        require(durationInHours > 0, "Invalid duration");

        uint256 newLotteryId = lotteryId;
        lotteryId++;

        lotteries[newLotteryId] = Lottery({
            id: newLotteryId,
            totalPool: 0,
            endTime: block.timestamp + (durationInHours * 1 hours),
            winner: address(0),
            completed: false,
            ticketCount: 0
        });

        emit LotteryCreated(newLotteryId, ticketPrice, lotteries[newLotteryId].endTime);
    }

    function buyTickets(uint256 _lotteryId, uint256 ticketCount) external payable {
        Lottery storage lottery = lotteries[_lotteryId];
        require(!lottery.completed, "Lottery completed");
        require(block.timestamp < lottery.endTime, "Lottery ended");
        require(ticketCount > 0 && ticketCount <= maxTicketsPerUser, "Invalid ticket count");
        require(msg.value == ticketPrice * ticketCount, "Incorrect payment");

        if (userTickets[_lotteryId][msg.sender] == 0) {
            lotteryParticipants[_lotteryId].push(msg.sender);
        }

        userTickets[_lotteryId][msg.sender] += ticketCount;
        lottery.totalPool += msg.value;
        lottery.ticketCount += ticketCount;

        emit TicketPurchased(_lotteryId, msg.sender, ticketCount);
    }

    function selectWinner(uint256 _lotteryId) external {
        Lottery storage lottery = lotteries[_lotteryId];
        require(block.timestamp >= lottery.endTime, "Lottery not ended");
        require(!lottery.completed, "Winner already selected");
        require(lottery.ticketCount > 0, "No participants");

        // Simple random selection (not cryptographically secure - for demo purposes)
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            lotteryParticipants[_lotteryId].length
        ))) % lotteryParticipants[_lotteryId].length;

        address winner = lotteryParticipants[_lotteryId][randomIndex];
        lottery.winner = winner;
        lottery.completed = true;

        // Calculate prize (95% to winner, 5% to owner as fee)
        uint256 prize = (lottery.totalPool * 95) / 100;
        uint256 fee = lottery.totalPool - prize;

        payable(winner).transfer(prize);
        payable(owner).transfer(fee);

        emit WinnerSelected(_lotteryId, winner, prize);
    }

    function getLotteryInfo(uint256 _lotteryId) external view returns (
        uint256 totalPool,
        uint256 endTime,
        address winner,
        bool completed,
        uint256 ticketCount,
        uint256 participantCount
    ) {
        Lottery storage lottery = lotteries[_lotteryId];
        return (
            lottery.totalPool,
            lottery.endTime,
            lottery.winner,
            lottery.completed,
            lottery.ticketCount,
            lotteryParticipants[_lotteryId].length
        );
    }

    function getUserTickets(uint256 _lotteryId, address user) external view returns (uint256) {
        return userTickets[_lotteryId][user];
    }

    function setTicketPrice(uint256 _ticketPrice) external onlyOwner {
        require(_ticketPrice > 0, "Invalid price");
        ticketPrice = _ticketPrice;
    }

    function setMaxTicketsPerUser(uint256 _maxTickets) external onlyOwner {
        require(_maxTickets > 0, "Invalid max tickets");
        maxTicketsPerUser = _maxTickets;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}`
  }
];

export const getTemplateById = (id: string): ContractTemplate | undefined => {
  return contractTemplates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): ContractTemplate[] => {
  return contractTemplates.filter(template => template.category === category);
};
